import { Injectable } from '@nestjs/common';
import {
  LoggerService,
  getErrorInfo,
  SchemaCreationException,
  isDomainException,
  InternalServerException,
} from '@app/shared';

import { TenantRepository } from '../infrastructure/tenant.repository';
import { TenantFactory } from '../infrastructure/tenant.factory';
import { Tenant } from '../domain/tenant.domain';

import { TenantMigrationService } from './tenant-migration.service';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantFactory: TenantFactory,
    private readonly migrationService: TenantMigrationService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TenantService');
  }

  async createTenant(data: {
    name: string;
    contactEmail: string;
    contactPhone?: string;
    [key: string]: any;
  }): Promise<{ tenant: Tenant }> {
    const tenant = this.tenantFactory.createTenant(data);

    let createdTenant: Tenant;

    try {
      createdTenant = await this.tenantRepository.createTenant(tenant);

      try {
        await this.migrationService.migrateSchema(createdTenant.schemaName!);
      } catch (error: unknown) {
        // Rollback - Ta bort tenant från public schema om schema-migrering misslyckas
        await this.tenantRepository.deleteTenant(createdTenant.id!);

        const errorInfo = getErrorInfo(error);
        this.logger.error(
          `Failed to create tenant schema for ${createdTenant.name}, rolling back tenant creation`,
          errorInfo.stack,
          { tenantId: createdTenant.id, schemaName: createdTenant.schemaName },
        );

        if (isDomainException(error)) {
          throw error;
        }

        throw new SchemaCreationException(
          createdTenant.schemaName!,
          `Failed to create schema for tenant: ${errorInfo.message}`,
        );
      }

      this.logger.log(`Tenant created and migrated: ${createdTenant.name}`);

      return {
        tenant: createdTenant,
      };
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);

      this.logger.error(
        `Tenant creation failed for ${data.name}`,
        errorInfo.stack,
        { tenantName: data.name, contactEmail: data.contactEmail },
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to create tenant: ${errorInfo.message}`,
      );
    }
  }

  async getTenantById(id: string): Promise<Tenant> {
    try {
      const tenant = await this.tenantRepository.findById(id);
      if (!tenant) {
        throw new Error(`Tenant not found with id: ${id}`);
      }
      return tenant;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to get tenant by ID: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to get tenant: ${errorInfo.message}`,
      );
    }
  }

  async getTenantBySchemaName(schemaName: string): Promise<Tenant> {
    try {
      const tenant = await this.tenantRepository.findBySchemaName(schemaName);
      if (!tenant) {
        throw new Error(`Tenant not found with schema name: ${schemaName}`);
      }
      return tenant;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to get tenant by schema name: ${schemaName}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to get tenant by schema name: ${errorInfo.message}`,
      );
    }
  }

  async getTenantByDomain(domain: string): Promise<Tenant> {
    try {
      return this.tenantRepository.findByDomain(domain);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to get tenant by domain: ${domain}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to get tenant by domain: ${errorInfo.message}`,
      );
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    try {
      return this.tenantRepository.findAll();
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error('Failed to get all tenants', errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to get all tenants: ${errorInfo.message}`,
      );
    }
  }

  async activateTenant(id: string): Promise<Tenant> {
    try {
      const tenant = await this.getTenantById(id);
      tenant.activate();
      return this.tenantRepository.save(tenant);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to activate tenant: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to activate tenant: ${errorInfo.message}`,
      );
    }
  }

  async deactivateTenant(id: string): Promise<Tenant> {
    try {
      const tenant = await this.getTenantById(id);
      tenant.deactivate();
      return this.tenantRepository.save(tenant);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to deactivate tenant: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to deactivate tenant: ${errorInfo.message}`,
      );
    }
  }

  async updateContactInfo(
    id: string,
    email: string,
    phone?: string,
  ): Promise<Tenant> {
    try {
      const tenant = await this.getTenantById(id);
      tenant.updateContactInfo(email, phone);
      return this.tenantRepository.save(tenant);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to update contact info for tenant: ${id}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to update contact info: ${errorInfo.message}`,
      );
    }
  }

  async deleteTenant(id: string): Promise<void> {
    try {
      const tenant = await this.getTenantById(id);

      await this.tenantRepository.deleteTenant(tenant.id!);

      this.logger.log(`Tenant deleted: ${tenant.name}`);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to delete tenant: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to delete tenant: ${errorInfo.message}`,
      );
    }
  }
}
