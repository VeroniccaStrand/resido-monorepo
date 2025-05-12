import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import {
  EntityManager,
  RequestContext,
  FilterQuery,
  FindOptions,
  EntityName,
  FindOneOptions,
} from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { LoggerService } from '@app/shared';
import * as genericPool from 'generic-pool';
import { ConfigService } from '@nestjs/config';

const schemaContextStorage = new AsyncLocalStorage<string>();

interface SchemaConnection {
  em: EntityManager;
  schemaName: string;
  lastUsed: number;
}

interface QueryRunner {
  execute<T>(query: string, params?: unknown[]): Promise<T>;
  find<T extends object>(
    entityClass: EntityName<T>,
    where: FilterQuery<T>,
    options?: FindOptions<T, never>,
  ): Promise<T[]>;
  findOne<T extends object>(
    entityClass: EntityName<T>,
    where: FilterQuery<T>,
    options?: FindOneOptions<T, never>,
  ): Promise<T | null>;
}

@Injectable()
export class TenantConnectionManagerService
  implements OnModuleInit, OnModuleDestroy
{
  private connectionPools = new Map<
    string,
    genericPool.Pool<SchemaConnection>
  >();
  private poolLastUsedTime = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout;

  // Pool-konfiguration
  private readonly poolConfig: {
    maxSize: number;
    minSize: number;
    acquireTimeoutMs: number;
    idleTimeoutMs: number;
    inactivityTimeoutMs: number;
    cleanupIntervalMs: number;
  };

  constructor(
    @InjectEntityManager('public') private readonly publicEm: EntityManager,
    @InjectEntityManager('tenant') private readonly tenantEm: EntityManager,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext('TenantConnectionManagerService');

    this.poolConfig = {
      maxSize: this.configService.get<number>('DB_POOL_SIZE', 5),
      minSize: this.configService.get<number>('DB_POOL_MIN_SIZE', 0),
      acquireTimeoutMs: this.configService.get<number>(
        'DB_POOL_ACQUIRE_TIMEOUT',
        15000,
      ),
      idleTimeoutMs: this.configService.get<number>(
        'DB_POOL_IDLE_TIMEOUT',
        60000,
      ), // 1 minut
      inactivityTimeoutMs: this.configService.get<number>(
        'DB_POOL_INACTIVITY_TIMEOUT',
        300000,
      ), // 5 minuter
      cleanupIntervalMs: this.configService.get<number>(
        'DB_POOL_CLEANUP_INTERVAL',
        300000,
      ), // 5 minuter
    };
  }

  onModuleInit(): void {
    this.startPoolCleanup();
    this.logger.log('TenantConnectionManagerService initialized');
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.cleanupInterval);

    const closePromises = Array.from(this.connectionPools.entries()).map(
      async ([schema, pool]) => {
        try {
          this.logger.log(`Closing pool for schema: ${schema}`);
          await pool.drain();
          await pool.clear();
        } catch (error) {
          this.logger.error(
            `Error closing pool for schema: ${schema}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      },
    );

    await Promise.all(closePromises);
    this.logger.log('All connection pools closed');
  }

  getSchemaName(): string {
    const schema = schemaContextStorage.getStore();
    if (!schema) {
      throw new Error(
        'No schema context found. Ensure the request passes through SchemaContextInterceptor',
      );
    }
    return schema;
  }

  async runWithPublicSchema<T>(
    callback: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.runInTenantContext('public', callback);
  }

  async runWithTenantSchema<T>(
    schemaName: string,
    callback: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.runInTenantContext(schemaName, callback);
  }

  async runWithCurrentSchema<T>(
    callback: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    const schemaName = this.getSchemaName();
    return this.runInTenantContext(schemaName, callback);
  }

  private startPoolCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [schema, pool] of this.connectionPools.entries()) {
        const lastUsedTime = this.poolLastUsedTime.get(schema) || 0;
        const timeSinceLastUse = now - lastUsedTime;

        if (
          timeSinceLastUse > this.poolConfig.inactivityTimeoutMs &&
          pool.borrowed === 0
        ) {
          this.logger.log(`Cleaning up inactive pool for schema: ${schema}`);

          void (async () => {
            try {
              await pool.drain();
              await pool.clear();
              this.connectionPools.delete(schema);
              this.poolLastUsedTime.delete(schema);
            } catch (error) {
              this.logger.error(
                `Failed to clean up pool for schema: ${schema}`,
                error instanceof Error ? error.stack : String(error),
              );
            }
          })();
        }
      }
    }, this.poolConfig.cleanupIntervalMs);
  }

  private getOrCreatePool(
    schemaName: string,
  ): genericPool.Pool<SchemaConnection> {
    if (this.connectionPools.has(schemaName)) {
      const pool = this.connectionPools.get(schemaName)!;
      this.poolLastUsedTime.set(schemaName, Date.now());
      return pool;
    }

    this.logger.log(`Creating connection pool for schema: ${schemaName}`);

    const baseEm = schemaName === 'public' ? this.publicEm : this.tenantEm;

    const factory: genericPool.Factory<SchemaConnection> = {
      create: async (): Promise<SchemaConnection> => {
        try {
          const em = baseEm.fork({ schema: schemaName });
          const connection = em.getConnection();

          await connection.execute(`SET search_path TO "${schemaName}"`);
          await connection.execute('SELECT 1');

          this.logger.debug(`Created connection for schema: ${schemaName}`);

          return {
            em,
            schemaName,
            lastUsed: Date.now(),
          };
        } catch (error) {
          this.logger.error(
            `Failed to create connection for schema: ${schemaName}`,
            error instanceof Error ? error.stack : String(error),
          );
          throw error;
        }
      },

      destroy: async (conn: SchemaConnection): Promise<void> => {
        try {
          const connection = conn.em.getConnection();
          if (await connection.isConnected()) {
            await connection.close();
          }
          this.logger.debug(`Destroyed connection for schema: ${schemaName}`);
        } catch (error) {
          this.logger.error(
            `Error closing connection for schema: ${schemaName}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      },

      validate: async (conn: SchemaConnection): Promise<boolean> => {
        try {
          const connection = conn.em.getConnection();
          if (await connection.isConnected()) {
            // Kör en enkel fråga för att säkerställa att anslutningen fungerar
            await connection.execute('SELECT 1');
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    };

    // Konfigurera pool med options
    const poolOptions: genericPool.Options = {
      max: this.poolConfig.maxSize,
      min: this.poolConfig.minSize,
      acquireTimeoutMillis: this.poolConfig.acquireTimeoutMs,
      idleTimeoutMillis: this.poolConfig.idleTimeoutMs,
      testOnBorrow: true, // Validera kopplingar vid lån
      autostart: false,
    };

    const pool = genericPool.createPool<SchemaConnection>(factory, poolOptions);
    this.connectionPools.set(schemaName, pool);
    this.poolLastUsedTime.set(schemaName, Date.now());

    return pool;
  }

  async runInTenantContext<T>(
    schemaName: string,
    callback: (em: EntityManager) => Promise<T>,
    retries = 2,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt === 0) {
        this.logger.debug(`Running in tenant context: ${schemaName}`);
      } else {
        this.logger.debug(
          `Retry ${attempt}/${retries} for schema: ${schemaName}`,
        );
      }

      const pool = this.getOrCreatePool(schemaName);
      let conn: SchemaConnection | undefined;

      try {
        conn = await pool.acquire();

        if (!conn) {
          throw new Error(
            `Failed to acquire valid connection for schema: ${schemaName}`,
          );
        }

        conn.lastUsed = Date.now();
        this.poolLastUsedTime.set(schemaName, Date.now());

        return await schemaContextStorage.run(schemaName, async () => {
          return await RequestContext.create(conn!.em, () =>
            callback(conn!.em),
          );
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;

        this.logger.error(
          `Error executing in tenant context for schema: ${schemaName}`,
          err.stack,
          { attempt: attempt + 1, maxAttempts: retries + 1 },
        );

        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } finally {
        if (conn && pool) {
          try {
            await pool.release(conn);
          } catch (releaseError) {
            this.logger.error(
              `Failed to release connection for schema: ${schemaName}`,
              releaseError instanceof Error
                ? releaseError.stack
                : String(releaseError),
            );
          }
        }
      }
    }

    throw (
      lastError || new Error(`All retries failed for schema: ${schemaName}`)
    );
  }

  async executeQuery<T>(
    schemaName: string,
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    return this.runInTenantContext(schemaName, async (em) => {
      const queryRunner: QueryRunner = {
        execute: <R>(query: string, params?: unknown[]): Promise<R> => {
          return em.getConnection().execute(query, params);
        },

        find: <R extends object>(
          entityClass: EntityName<R>,
          where: FilterQuery<R>,
          options?: FindOptions<R, never>,
        ): Promise<R[]> => {
          return em.find(entityClass, where, options);
        },

        findOne: <R extends object>(
          entityClass: EntityName<R>,
          where: FilterQuery<R>,
          options?: FindOneOptions<R, never>,
        ): Promise<R | null> => {
          return em.findOne(entityClass, where, options);
        },
      };

      return operation(queryRunner);
    });
  }
}
