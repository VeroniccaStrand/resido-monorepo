import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Tenant } from '../domain/tenant.domain';
import { TenantEntity } from './tenant.entity';
import { LoggerService } from '@app/shared';
import { TenantMapper } from './tenant.mapper';
import { TenantConnectionManagerService } from '../../tenancy/tenant-connection-manager.service';

@Injectable()
export class TenantRepository {
  constructor(
    private readonly tenantConnectionManager: TenantConnectionManagerService,
    private readonly mapper: TenantMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TenantRepository');
  }

  async createTenant(tenant: Tenant): Promise<Tenant> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      return em.transactional(async (txEm) => {
        const entity = this.mapper.toNewEntity(tenant);

        await txEm.persistAndFlush(entity);
        this.logger.log(`Tenant record created: ${entity.id}`);

        await this.createSchema(tenant.schemaName!, txEm);

        return this.mapper.toDomain(entity);
      });
    });
  }

  async createSchema(schemaName: string, em?: EntityManager): Promise<void> {
    if (em) {
      // Om EntityManager redan är tillgänglig (t.ex. från en transaktion)
      await em
        .getConnection()
        .execute(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      this.logger.log(`Schema created: ${schemaName}`);
    } else {
      // Annars använd en ny connection
      await this.tenantConnectionManager.runWithPublicSchema(async (em) => {
        await em
          .getConnection()
          .execute(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        this.logger.log(`Schema created: ${schemaName}`);
      });
    }
  }

  async findByDomain(domain: string): Promise<Tenant> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = await em.findOneOrFail(TenantEntity, { name: domain });
      return this.mapper.toDomain(entity);
    });
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = await em.findOne(TenantEntity, { id });
      if (!entity) return null;
      return this.mapper.toDomain(entity);
    });
  }

  async findBySchemaName(schemaName: string): Promise<Tenant | null> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = await em.findOne(TenantEntity, { schemaName });
      if (!entity) return null;
      return this.mapper.toDomain(entity);
    });
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entities = await em.find(TenantEntity, {});
      return entities.map((entity) => this.mapper.toDomain(entity));
    });
  }

  async save(tenant: Tenant): Promise<Tenant> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = await em.findOne(TenantEntity, { id: tenant.id });

      if (!entity) {
        throw new Error(
          `Cannot save tenant: Entity with id ${tenant.id} not found`,
        );
      }

      entity.name = tenant.name;
      entity.contactEmail = tenant.contactEmail;
      entity.contactPhone = tenant.contactPhone;
      entity.isActive = tenant.isActive;
      entity.updatedAt = tenant.updatedAt;

      await em.flush();

      return tenant;
    });
  }

  async deleteTenant(id: string): Promise<void> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      return em.transactional(async (txEm) => {
        const entity = await txEm.findOne(TenantEntity, { id });

        if (!entity) {
          throw new Error(
            `Cannot delete tenant: Entity with id ${id} not found`,
          );
        }

        await txEm.removeAndFlush(entity);
        this.logger.log(`Tenant record deleted: ${id}`);
      });
    });
  }
}
