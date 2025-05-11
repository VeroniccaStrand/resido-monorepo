// src/user-tenant-mapper/infrastructure/user-tenant-mapper.repository.ts
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { UserTenantMapper } from '../domain/user-tenant-mapper.domain';
import { UserTenantMapperEntity } from './user-tenant-mapper.entity';
import { UserTenantMapperMapper } from './user-tenant-mapper.mapper';
import { LoggerService } from '@app/shared';

@Injectable()
export class UserTenantMapperRepository {
  constructor(
    @InjectEntityManager('public')
    private readonly em: EntityManager,
    private readonly mapper: UserTenantMapperMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserTenantMapperRepository');
  }

  async create(mapper: UserTenantMapper): Promise<UserTenantMapper> {
    const entity = this.mapper.toNewEntity(mapper);

    this.em.persist(entity);
    await this.em.flush();

    return this.mapper.toDomain(entity);
  }

  async findByEmail(email: string): Promise<UserTenantMapper | null> {
    const entity = await this.em.findOne(UserTenantMapperEntity, { email });
    if (!entity) {
      return null;
    }
    return this.mapper.toDomain(entity);
  }

  async save(mapper: UserTenantMapper): Promise<UserTenantMapper> {
    if (!mapper.id) {
      return this.create(mapper);
    }

    const entity = await this.em.findOne(UserTenantMapperEntity, {
      id: mapper.id,
    });
    if (!entity) {
      throw new Error(`UserTenantMapper with id ${mapper.id} not found`);
    }

    this.mapper.updateEntity(entity, mapper);
    await this.em.flush();

    return this.mapper.toDomain(entity);
  }
}
