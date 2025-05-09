import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { LoggerService, getErrorInfo } from '@app/shared';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { TenantsResponseDto } from './dto/tenants-response.dto';
import { UpdateContactInfoDto } from './dto/update-tenant.dto';
import { TenantMapper } from './mapper/tenant.mapper';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantMapper: TenantMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TenantController');
  }

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tenant created successfully',
    type: TenantResponseDto,
  })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    this.logger.log(`Creating tenant: ${createTenantDto.name}`);
    try {
      const grpcResponse =
        await this.tenantService.createTenant(createTenantDto);
      const response = this.tenantMapper.toResponseDto(grpcResponse);
      this.logger.log(`Tenant created successfully with ID: ${response.id}`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to create tenant: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all tenants retrieved successfully',
    type: TenantsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - requires admin access',
  })
  async getAllTenants(): Promise<TenantsResponseDto> {
    this.logger.debug('Fetching all tenants');

    try {
      const grpcResponse = await this.tenantService.getAllTenants();
      return this.tenantMapper.toResponsesDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to fetch tenants: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant retrieved successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - requires admin access',
  })
  async getTenantById(@Param('id') id: string): Promise<TenantResponseDto> {
    this.logger.debug(`Fetching tenant with ID: ${id}`);

    try {
      const grpcResponse = await this.tenantService.getTenantById({ id });
      return this.tenantMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to fetch tenant: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Put(':id/contact')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant contact information' })
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact information updated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - requires admin access',
  })
  async updateContactInfo(
    @Param('id') id: string,
    @Body() updateDto: UpdateContactInfoDto,
  ): Promise<TenantResponseDto> {
    this.logger.log(`Updating contact info for tenant ID: ${id}`);

    try {
      const grpcResponse = await this.tenantService.updateContactInfo({
        id,
        contactEmail: updateDto.contactEmail,
        contactPhone: updateDto.contactPhone || '',
      });

      return this.tenantMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to update tenant contact info: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Put(':id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a tenant' })
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant activated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - requires admin access',
  })
  async activateTenant(@Param('id') id: string): Promise<TenantResponseDto> {
    this.logger.log(`Activating tenant ID: ${id}`);

    try {
      const grpcResponse = await this.tenantService.activateTenant({ id });
      return this.tenantMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to activate tenant: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Put(':id/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a tenant' })
  @ApiParam({
    name: 'id',
    description: 'Tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant deactivated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - requires admin access',
  })
  async deactivateTenant(@Param('id') id: string): Promise<TenantResponseDto> {
    this.logger.log(`Deactivating tenant ID: ${id}`);

    try {
      const grpcResponse = await this.tenantService.deactivateTenant({ id });
      return this.tenantMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to deactivate tenant: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }
}
