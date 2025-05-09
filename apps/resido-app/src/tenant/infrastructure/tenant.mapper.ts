import { Injectable } from '@nestjs/common';
import { Tenant } from '../domain/tenant.domain';
import { TenantEntity } from './tenant.entity';
import { TenantResponse } from '@app/shared/proto-gen/resido';

@Injectable()
export class TenantMapper {
  // Konvertera från entitet till domänmodell
  toDomain(entity: TenantEntity): Tenant {
    return new Tenant({
      id: entity.id,
      name: entity.name,
      schemaName: entity.schemaName,
      contactEmail: entity.contactEmail,
      contactPhone: entity.contactPhone,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  toResponse(domain: Tenant): TenantResponse {
    // Om schemaName är undefined, kasta ett fel eftersom det behövs
    if (domain.schemaName === undefined) {
      throw new Error('Schema name is required for response');
    }

    return {
      id: domain.id || '',
      name: domain.name,
      schemaName: domain.schemaName,
      contactEmail: domain.contactEmail,
      contactPhone: domain.contactPhone || '',
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      activationToken: '', // Lägg till denna rad
    };
  }

  toNewEntity(domain: Tenant): TenantEntity {
    const entity = new TenantEntity();
    entity.name = domain.name;

    if (!domain.schemaName) {
      throw new Error('Schema name is required for entity');
    }
    entity.schemaName = domain.schemaName;

    entity.contactEmail = domain.contactEmail;
    entity.contactPhone = domain.contactPhone;
    entity.isActive = domain.isActive;
    return entity;
  }

  // Uppdatera existerande entitet från domänmodell
  updateEntity(entity: TenantEntity, domain: Tenant): void {
    entity.name = domain.name;

    // Uppdatera bara schemaName om det finns
    if (domain.schemaName) {
      entity.schemaName = domain.schemaName;
    }

    entity.contactEmail = domain.contactEmail;
    entity.contactPhone = domain.contactPhone;
    entity.isActive = domain.isActive;
  }
}
