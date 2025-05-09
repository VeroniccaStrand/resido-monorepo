import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import tenantConfig from '../../config/mikro-orm-tenant.config';
import { LoggerService } from '@app/shared';

@Injectable()
export class TenantMigrationService {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('TenantMigrationService');
  }

  async migrateSchema(schemaName: string): Promise<void> {
    try {
      const orm = await MikroORM.init({
        ...tenantConfig,
        schema: schemaName,
        driverOptions: {
          connection: {
            options: `-c search_path=${schemaName},public`,
          },
        },
        migrations: tenantConfig.migrations,
      });

      try {
        const migrator = orm.getMigrator();
        const pending = await migrator.getPendingMigrations();

        if (pending.length > 0) {
          this.logger.log(
            `Applying ${pending.length} migrations to ${schemaName}`,
          );
          await migrator.up();
          this.logger.log(`Successfully applied migrations to ${schemaName}`);
        } else {
          this.logger.log(`No pending migrations for ${schemaName}`);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        const errorStack =
          error instanceof Error ? error.stack : 'No stack trace available';

        this.logger.error(
          `Failed to apply migrations to ${schemaName}`,
          errorStack,
          {
            schema: schemaName,
            error: errorMessage,
          },
        );
        throw error;
      } finally {
        await orm.close(true);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const errorStack =
        error instanceof Error ? error.stack : 'No stack trace available';

      this.logger.error(
        `Failed to initialize MikroORM for ${schemaName}`,
        errorStack,
        {
          schema: schemaName,
          error: errorMessage,
        },
      );
      throw error;
    }
  }
}
