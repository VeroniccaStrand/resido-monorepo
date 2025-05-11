import { Injectable } from '@nestjs/common';
import { UserTenantMapper } from '../domain/user-tenant-mapper.domain';
import { UserTenantMapperEntity } from './user-tenant-mapper.entity';
import { UserTenantMapperResponse } from '@app/shared/proto-gen/resido';

@Injectable()
export class UserTenantMapperMapper {
  toDomain(entity: UserTenantMapperEntity): UserTenantMapper {
    return new UserTenantMapper({
      id: entity.id,
      email: entity.email,
      hashedSchemaName: entity.hashedSchemaName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt || entity.createdAt,
    });
  }

  toResponse(domain: UserTenantMapper): UserTenantMapperResponse {
    return {
      schemaName: domain.hashedSchemaName,
    };
  }

  toNewEntity(domain: UserTenantMapper): UserTenantMapperEntity {
    const entity = new UserTenantMapperEntity();
    entity.email = domain.email;
    entity.hashedSchemaName = domain.hashedSchemaName;
    return entity;
  }

  updateEntity(entity: UserTenantMapperEntity, domain: UserTenantMapper): void {
    entity.email = domain.email;
    entity.hashedSchemaName = domain.hashedSchemaName;
  }
}
