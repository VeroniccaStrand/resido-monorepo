import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { SchemaContextService } from './schema-context.service';
import { LoggerService } from '@app/shared';

@Injectable()
export class SchemaConnectionService {
  private cachedEntityManagers = new Map<string, EntityManager>();
  private cachedTenantManagers = new Map<string, EntityManager>();

  constructor(
    @InjectEntityManager('tenant') private readonly tenantEm: EntityManager,
    @InjectEntityManager('public') private readonly publicEm: EntityManager,
    private readonly schemaContextService: SchemaContextService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('SchemaConnectionService');
  }

  getSchemaName(): string {
    const schemaName = this.schemaContextService.getSchemaName();
    if (!schemaName) {
      this.logger.warn('No schema set in context — defaulting to "public"');
    } else {
      this.logger.debug(`Current schema name: ${schemaName}`);
    }
    return schemaName || 'public';
  }

  getEntityManager(): EntityManager {
    const schemaName = this.getSchemaName();

    if (schemaName === 'public') {
      return this.getPublicEntityManager();
    }

    if (this.cachedEntityManagers.has(schemaName)) {
      return this.cachedEntityManagers.get(schemaName)!;
    }

    this.logger.debug(`Creating new EntityManager for schema: ${schemaName}`);
    const em = this.tenantEm.fork({ schema: schemaName });
    this.cachedEntityManagers.set(schemaName, em);

    return em;
  }

  getPublicEntityManager(): EntityManager {
    if (this.cachedEntityManagers.has('public')) {
      return this.cachedEntityManagers.get('public')!;
    }

    this.logger.debug('Creating new EntityManager for public schema');
    const em = this.publicEm.fork();
    this.cachedEntityManagers.set('public', em);

    return em;
  }

  getTenantEntityManager(schemaName: string): EntityManager {
    if (this.cachedTenantManagers.has(schemaName)) {
      return this.cachedTenantManagers.get(schemaName)!;
    }

    this.logger.debug(
      `Creating new tenant EntityManager for schema: ${schemaName}`,
    );
    const em = this.tenantEm.fork({ schema: schemaName });
    this.cachedTenantManagers.set(schemaName, em);

    return em;
  }

  async runWithSchema<T>(
    operation: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    const em = this.getEntityManager();
    return operation(em);
  }

  async runWithPublicSchema<T>(
    operation: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    const em = this.getPublicEntityManager();
    return operation(em);
  }

  async runWithTenantSchema<T>(
    schemaName: string,
    operation: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    const em = this.getTenantEntityManager(schemaName);
    return operation(em);
  }
}
