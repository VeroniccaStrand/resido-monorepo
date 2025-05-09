// src/tenant/infrastructure/tenant.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Tenant } from '../domain/tenant.domain';
import { TenantEntity } from './tenant.entity';

import { LoggerService } from '@app/shared';
import { TenantMapper } from './tenant.mapper';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectEntityManager('public') private readonly em: EntityManager,
    private readonly mapper: TenantMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TenantRepository');
  }

  async createTenant(tenant: Tenant): Promise<Tenant> {
    return this.em.transactional(async (em) => {
      const entity = this.mapper.toNewEntity(tenant);

      await em.persistAndFlush(entity);
      this.logger.log(`Tenant record created: ${entity.id}`);

      await this.createSchema(tenant.schemaName!, em);

      return this.mapper.toDomain(entity);
    });
  }

  async createSchema(schemaName: string, em?: EntityManager): Promise<void> {
    const entityManager = em || this.em;
    await entityManager
      .getConnection()
      .execute(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    this.logger.log(`Schema created: ${schemaName}`);
  }

  async findByDomain(domain: string): Promise<Tenant> {
    const entity = await this.em.findOneOrFail(TenantEntity, { name: domain });
    return this.mapper.toDomain(entity);
  }

  async findById(id: string): Promise<Tenant | null> {
    const entity = await this.em.findOne(TenantEntity, { id });
    if (!entity) return null;
    return this.mapper.toDomain(entity);
  }

  async findBySchemaName(schemaName: string): Promise<Tenant | null> {
    const entity = await this.em.findOne(TenantEntity, { schemaName });
    if (!entity) return null;
    return this.mapper.toDomain(entity);
  }

  async findAll(): Promise<Tenant[]> {
    const entities = await this.em.find(TenantEntity, {});
    return entities.map((entity) => this.mapper.toDomain(entity));
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const entity = await this.em.findOne(TenantEntity, { id: tenant.id });

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

    await this.em.flush();

    return tenant;
  }
  async deleteTenant(id: string): Promise<void> {
    return this.em.transactional(async (em) => {
      const entity = await em.findOne(TenantEntity, { id });

      if (!entity) {
        throw new Error(`Cannot delete tenant: Entity with id ${id} not found`);
      }

      await em.removeAndFlush(entity);
      this.logger.log(`Tenant record deleted: ${id}`);
    });
  }
}
