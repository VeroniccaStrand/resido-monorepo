import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateTenantRequest,
  GetTenantByIdRequest,
  GetTenantBySchemaNameRequest,
  TenantIdRequest,
  UpdateContactInfoRequest,
  TenantResponse,
  TenantsResponse,
} from '@app/shared/proto-gen/resido';

import { TenantService } from './services/tenant.service';
import { TenantMapper } from './infrastructure/tenant.mapper';
import { UsePublicSchema } from '../tenancy/public-schema.decorator';
import { Public } from 'apps/resido-app/decorators/public.decorator';
@Public()
@Controller()
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantMapper: TenantMapper,
  ) {}
  @UsePublicSchema()
  @GrpcMethod('TenantService', 'CreateTenant')
  async createTenant(request: CreateTenantRequest): Promise<TenantResponse> {
    const result = await this.tenantService.createTenant({
      name: request.name,
      contactEmail: request.contactEmail,
    });

    const tenantResponse = this.tenantMapper.toResponse(result.tenant);
    return tenantResponse;
  }
  @UsePublicSchema()
  @GrpcMethod('TenantService', 'GetTenantById')
  async getTenantById(request: GetTenantByIdRequest): Promise<TenantResponse> {
    const tenant = await this.tenantService.getTenantById(request.id);
    return this.tenantMapper.toResponse(tenant);
  }
  @UsePublicSchema()
  @GrpcMethod('TenantService', 'GetTenantBySchemaName')
  async getTenantBySchemaName(
    request: GetTenantBySchemaNameRequest,
  ): Promise<TenantResponse> {
    const tenant = await this.tenantService.getTenantBySchemaName(
      request.schemaName,
    );
    return this.tenantMapper.toResponse(tenant);
  }
  @UsePublicSchema()
  @GrpcMethod('TenantService', 'GetAllTenants')
  async getAllTenants(): Promise<TenantsResponse> {
    const tenants = await this.tenantService.getAllTenants();
    return {
      tenants: tenants.map((tenant) => this.tenantMapper.toResponse(tenant)),
    };
  }
  @UsePublicSchema()
  @GrpcMethod('TenantService', 'ActivateTenant')
  async activateTenant(request: TenantIdRequest): Promise<TenantResponse> {
    const tenant = await this.tenantService.activateTenant(request.id);
    return this.tenantMapper.toResponse(tenant);
  }
  @UsePublicSchema()
  @GrpcMethod('TenantService', 'DeactivateTenant')
  async deactivateTenant(request: TenantIdRequest): Promise<TenantResponse> {
    const tenant = await this.tenantService.deactivateTenant(request.id);
    return this.tenantMapper.toResponse(tenant);
  }
  @UsePublicSchema()
  @GrpcMethod('TenantService', 'UpdateContactInfo')
  async updateContactInfo(
    request: UpdateContactInfoRequest,
  ): Promise<TenantResponse> {
    const tenant = await this.tenantService.updateContactInfo(
      request.id,
      request.contactEmail,
      request.contactPhone,
    );
    return this.tenantMapper.toResponse(tenant);
  }
}
