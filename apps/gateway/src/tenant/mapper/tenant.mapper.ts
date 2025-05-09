import { Injectable } from '@nestjs/common';
import { TenantResponse, TenantsResponse } from '@app/shared/proto-gen/resido';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { TenantsResponseDto } from '../dto/tenants-response.dto';

@Injectable()
export class TenantMapper {
  toResponseDto(grpcResponse: TenantResponse): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = grpcResponse.id;
    dto.name = grpcResponse.name;
    dto.schemaName = grpcResponse.schemaName;
    dto.active = grpcResponse.isActive;
    dto.contactEmail = grpcResponse.contactEmail;
    dto.contactPhone = grpcResponse.contactPhone;
    dto.createdAt = grpcResponse.createdAt;
    dto.updatedAt = grpcResponse.updatedAt;

    // Include activation token if it exists
    if (grpcResponse.activationToken) {
      dto.activationToken = grpcResponse.activationToken;
    }

    return dto;
  }

  toResponsesDto(grpcResponse: TenantsResponse): TenantsResponseDto {
    return {
      tenants: grpcResponse.tenants.map((tenant) => this.toResponseDto(tenant)),
    };
  }
}
