import 'reflect-metadata';
import 'ts-node/register';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import {
  LoggerService,
  getErrorInfo,
  isDomainException,
  LogPriority,
  DatabaseAccessException,
  MigrationException,
  MigrationLockException,
} from '@app/shared';
import publicConfig from '../config/mikro-orm-public.config';
import tenantConfig from '../config/mikro-orm-tenant.config';
import { TenantEntity } from '../tenant/infrastructure/tenant.entity';

interface MigrationConfig {
  path?: string;
  glob?: string;
  tableName?: string;
}

interface OrmConfig {
  migrations?: MigrationConfig;
  [key: string]: any;
}

interface TenantSchema {
  id: string;
  schema: string;
}

export interface MigrationOptions {
  batchSize?: number;
  silent?: boolean;
  specificTenantId?: string;
  lockTimeoutSeconds?: number;
}

export interface MigrationSummary {
  totalTenants: number;
  successful: number;
  skipped: number;
  failed: number;
  totalDuration: number;
  failedTenants: Array<{
    id: string;
    schema: string;
    error: string;
  }>;
}

interface TenantMigrationResult {
  appliedMigrations: string[];
  skippedMigrations: string[];
}

export async function migrateTenants(
  options: MigrationOptions = {},
): Promise<MigrationSummary> {
  const startTime = Date.now();

  const {
    batchSize = 5,
    silent = false,
    specificTenantId,
    lockTimeoutSeconds = 300, // 5 minuter
  } = options;

  const migrationSummary: MigrationSummary = {
    totalTenants: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
    totalDuration: 0,
    failedTenants: [],
  };

  const configService = new ConfigService();

  const logger = new LoggerService(configService);

  logger.setContext('TenantMigrator');

  if (!silent) {
    logger.log('=== TENANT MIGRATION PROCESS STARTED ===', {
      options: { batchSize, specificTenantId },
    });
  }

  let ormPub: MikroORM | undefined;
  let lockAcquired = false;

  try {
    if (!silent) {
      logger.log('Initializing public ORM connection...');
    }
    ormPub = await MikroORM.init(publicConfig);

    const emPub = ormPub.em.fork();

    try {
      const connection = emPub.getConnection();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const lockResult = await connection.execute(`
        SELECT pg_try_advisory_lock(hashtext('tenant_migration_lock')) AS acquired
      `);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      lockAcquired = lockResult[0]?.acquired as boolean;

      if (!lockAcquired) {
        throw new MigrationLockException(
          `Another migration process is already running. Could not acquire lock within ${lockTimeoutSeconds} seconds.`,
        );
      }

      if (!silent) {
        logger.log('Successfully acquired migration lock');
      }
    } catch (error) {
      if (!isDomainException(error)) {
        const errorInfo = getErrorInfo(error);
        throw new DatabaseAccessException(
          `Failed to acquire migration lock: ${errorInfo.message}`,
          errorInfo.name,
        );
      }
      throw error;
    }

    if (!silent) {
      logger.log('Fetching tenant list from public.tenants table...');
    }
    const tenantRepo = emPub.getRepository(TenantEntity);
    const tenants = specificTenantId
      ? await tenantRepo.find({ id: specificTenantId })
      : await tenantRepo.findAll();

    const tenantSchemas: TenantSchema[] = tenants.map((t) => ({
      id: String(t.id),
      schema: t.schemaName,
    }));

    migrationSummary.totalTenants = tenantSchemas.length;
    if (!silent) {
      logger.log(`Found ${tenantSchemas.length} tenants in public.tenants`, {
        tenantCount: tenantSchemas.length,
        specificTenantId,
      });
    }

    await ormPub.close(true);
    ormPub = undefined;

    if (tenantSchemas.length === 0) {
      if (!silent) {
        logger.log('No tenant schemas found. Migration completed.');
      }
      migrationSummary.totalDuration = Date.now() - startTime;
      return migrationSummary;
    }

    if (!silent) {
      logger.log(`Processing tenant schemas in batches of ${batchSize}`);
    }

    for (let i = 0; i < tenantSchemas.length; i += batchSize) {
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(tenantSchemas.length / batchSize);
      const batch = tenantSchemas.slice(i, i + batchSize);

      if (!silent) {
        logger.log(
          `Processing batch ${batchNumber}/${totalBatches} (${batch.length} tenant schemas)`,
          { batchNumber, totalBatches, batchSize: batch.length },
        );
      }

      const results = await Promise.allSettled(
        batch.map(async (t) => {
          return migrateTenantSchema(
            t,
            tenantConfig as OrmConfig,
            configService,
            silent,
          );
        }),
      );

      results.forEach((result, idx) => {
        const tenant = batch[idx];

        if (result.status === 'fulfilled') {
          if (result.value.appliedMigrations.length > 0) {
            migrationSummary.successful++;

            if (!silent) {
              logger.log(
                `✅ Applied ${result.value.appliedMigrations.length} migrations to ${tenant.schema}`,
                {
                  tenantId: tenant.id,
                  schema: tenant.schema,
                  appliedMigrations: result.value.appliedMigrations,
                },
              );
            }
          } else {
            migrationSummary.skipped++;

            if (!silent) {
              logger.log(`ℹ️ ${tenant.schema} was already up to date`, {
                tenantId: tenant.id,
                schema: tenant.schema,
              });
            }
          }
        } else if (result.status === 'rejected') {
          migrationSummary.failed++;
          const errorInfo = getErrorInfo(result.reason);

          migrationSummary.failedTenants.push({
            id: tenant.id,
            schema: tenant.schema,
            error: errorInfo.message,
          });

          logger.error(
            `❌ Failed to migrate ${tenant.schema}:`,
            errorInfo.stack,
            {
              tenantId: tenant.id,
              schema: tenant.schema,
              errorName: errorInfo.name,
              errorDetails: errorInfo.details,
            },
          );
        }
      });
    }

    migrationSummary.totalDuration = Date.now() - startTime;

    if (!silent) {
      logger.log(
        `=== TENANT MIGRATION PROCESS COMPLETED (${formatDuration(migrationSummary.totalDuration)}) ===`,
        {
          successful: migrationSummary.successful,
          skipped: migrationSummary.skipped,
          failed: migrationSummary.failed,
          durationFormatted: formatDuration(migrationSummary.totalDuration),
          totalDuration: migrationSummary.totalDuration,
        },
      );
    }

    if (migrationSummary.failed > 0) {
      logger.warn(
        `${migrationSummary.failed} tenant migrations failed`,
        LogPriority.P1,
        { failedTenants: migrationSummary.failedTenants },
      );
    }

    return migrationSummary;
  } catch (error) {
    const errorInfo = getErrorInfo(error);

    logger.error('Fatal error during migration process:', errorInfo.stack, {
      error: errorInfo.message,
      name: errorInfo.name,
      details: errorInfo.details,
    });

    throw error;
  } finally {
    if (lockAcquired && ormPub) {
      try {
        const connection = ormPub.em.getConnection();
        await connection.execute(
          `SELECT pg_advisory_unlock(hashtext('tenant_migration_lock'))`,
        );

        if (!silent) {
          logger.log('Migration lock released');
        }
      } catch (unlockError) {
        const errorInfo = getErrorInfo(unlockError);
        logger.error('Failed to release migration lock', errorInfo.message);
      }
    }

    if (ormPub) {
      try {
        await ormPub.close(true);
      } catch (closeError) {
        const errorInfo = getErrorInfo(closeError);
        logger.error('Failed to close ORM connection', errorInfo.message);
      }
    }
  }
}

async function migrateTenantSchema(
  tenant: TenantSchema,
  baseConfig: OrmConfig,
  configService: ConfigService,
  silent = false,
): Promise<TenantMigrationResult> {
  const logger = new LoggerService(configService);
  logger.setContext(`Tenant(${tenant.id})`);

  const schema = tenant.schema;

  if (!silent) {
    logger.log(`Migrating schema ${schema}`);
  }

  let orm: MikroORM | undefined;

  try {
    orm = await MikroORM.init({
      ...baseConfig,
      schema,
      driverOptions: {
        connection: {
          options: `-c search_path=${schema},public`,
        },
      },
      migrations: {
        path: baseConfig.migrations?.path,
        glob: baseConfig.migrations?.glob,
        tableName: baseConfig.migrations?.tableName,
      },
    });

    try {
      const connection = orm.em.getConnection();
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS "${schema}"."mikro_orm_migrations" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255),
            "executed_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (error) {
        const errorInfo = getErrorInfo(error);
        logger.error(
          `Failed to create migrations table: ${errorInfo.message}`,
          undefined,
          {
            tenantId: tenant.id,
            schema,
          },
        );

        throw new MigrationException(
          `Failed to create migrations table: ${errorInfo.message}`,
          tenant.id,
          schema,
        );
      }

      const migrator = orm.getMigrator();
      const executed = await migrator.getExecutedMigrations();

      if (!silent) {
        logger.log(`Executed migrations: ${executed.length}`, {
          executedCount: executed.length,
          tenantId: tenant.id,
        });
      }

      const pending = await migrator.getPendingMigrations();

      if (!silent) {
        logger.log(`Pending migrations: ${pending.length}`, {
          pendingCount: pending.length,
          pendingNames: pending.map((m) => m.name),
          tenantId: tenant.id,
        });
      }

      if (pending.length) {
        const result = await migrator.up();

        if (!silent) {
          logger.log(`✅ ${schema} updated with ${result.length} migrations`, {
            migrationsApplied: result.length,
            migrationNames: result.map((m) => m.name),
            tenantId: tenant.id,
          });
        }

        return {
          appliedMigrations: result.map((m) => m.name),
          skippedMigrations: [],
        };
      } else {
        if (!silent) {
          logger.log(`ℹ️ ${schema} was already up to date`, {
            tenantId: tenant.id,
          });
        }

        return {
          appliedMigrations: [],
          skippedMigrations: pending.map((m) => m.name),
        };
      }
    } finally {
      if (orm) {
        await orm.close(true);
      }
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error);

    logger.error(`Error migrating schema ${schema}:`, errorInfo.stack, {
      tenantId: tenant.id,
      schema: tenant.schema,
      errorName: errorInfo.name,
      errorDetails: errorInfo.details,
    });

    if (isDomainException(error)) {
      throw error;
    }

    throw new MigrationException(errorInfo.message, tenant.id, schema);
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

if (require.main === module) {
  console.log('Starting direct tenant migrations...');

  const batchSize = process.env.MIGRATION_BATCH_SIZE
    ? parseInt(process.env.MIGRATION_BATCH_SIZE, 10)
    : 5;

  const specificTenantId = process.env.MIGRATION_TENANT_ID || undefined;

  migrateTenants({
    batchSize,
    specificTenantId,
  })
    .then((summary) => {
      console.log(`
=== MIGRATION SUMMARY ===
Total tenants: ${summary.totalTenants}
Successful: ${summary.successful}
Skipped: ${summary.skipped}
Failed: ${summary.failed}
Total duration: ${formatDuration(summary.totalDuration)}
      `);

      if (summary.failed > 0) {
        console.error('Failed tenants:');
        summary.failedTenants.forEach((tenant) => {
          console.error(`- ${tenant.schema}: ${tenant.error}`);
        });
        process.exit(1);
      } else {
        console.log('All tenant migrations completed successfully');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error(
        'Migration process failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      process.exit(1);
    });
}
