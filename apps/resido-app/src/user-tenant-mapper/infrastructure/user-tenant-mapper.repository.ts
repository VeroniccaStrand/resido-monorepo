import { Injectable } from '@nestjs/common';
import { LoggerService } from '@app/shared';
import { TenantConnectionManagerService } from '../../tenancy/tenant-connection-manager.service';
import { UserTenantMapper } from '../domain/user-tenant-mapper.domain';
import { UserTenantMapperEntity } from './user-tenant-mapper.entity';
import { UserTenantMapperMapper } from './user-tenant-mapper.mapper';

@Injectable()
export class UserTenantMapperRepository {
  constructor(
    private readonly tenantConnectionManager: TenantConnectionManagerService,
    private readonly mapper: UserTenantMapperMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserTenantMapperRepository');
  }

  async create(mapper: UserTenantMapper): Promise<UserTenantMapper> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = this.mapper.toNewEntity(mapper);

      em.persist(entity);
      await em.flush();

      return this.mapper.toDomain(entity);
    });
  }

  async findByEmail(email: string): Promise<UserTenantMapper | null> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = await em.findOne(UserTenantMapperEntity, { email });
      if (!entity) {
        return null;
      }
      return this.mapper.toDomain(entity);
    });
  }

  async save(mapper: UserTenantMapper): Promise<UserTenantMapper> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      if (!mapper.id) {
        const entity = this.mapper.toNewEntity(mapper);
        em.persist(entity);
        await em.flush();
        return this.mapper.toDomain(entity);
      }

      const entity = await em.findOne(UserTenantMapperEntity, {
        id: mapper.id,
      });
      if (!entity) {
        throw new Error(`UserTenantMapper with id ${mapper.id} not found`);
      }

      this.mapper.updateEntity(entity, mapper);
      await em.flush();

      return this.mapper.toDomain(entity);
    });
  }
}
