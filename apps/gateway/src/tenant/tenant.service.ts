import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  LoggerService,
  getErrorInfo,
  isDomainException,
  isNotFoundException,
  NotFoundException,
} from '@app/shared';
import {
  TenantResponse,
  TenantsResponse,
  CreateTenantRequest,
  GetTenantByIdRequest,
  TenantIdRequest,
  UpdateContactInfoRequest,
  TokenResponse,
} from '@app/shared/proto-gen/resido';
import { TokenService } from '../token/token.service';

interface TenantServiceClient {
  createTenant(data: CreateTenantRequest): Observable<TenantResponse>;
  getTenantById(data: GetTenantByIdRequest): Observable<TenantResponse>;
  getAllTenants(data: object): Observable<TenantsResponse>;
  activateTenant(data: TenantIdRequest): Observable<TenantResponse>;
  deactivateTenant(data: TenantIdRequest): Observable<TenantResponse>;
  updateContactInfo(data: UpdateContactInfoRequest): Observable<TenantResponse>;
}

@Injectable()
export class TenantService implements OnModuleInit {
  private tenantService: TenantServiceClient;

  constructor(
    private readonly logger: LoggerService,
    private readonly tokenService: TokenService,
    @Inject('TENANT_SERVICE') private client: ClientGrpc,
  ) {
    this.logger.setContext('TenantService');
  }

  onModuleInit() {
    this.tenantService =
      this.client.getService<TenantServiceClient>('TenantService');
    this.logger.log('TenantService gRPC client initialized');
  }

  async createTenant(data: CreateTenantRequest): Promise<TenantResponse> {
    this.logger.debug(
      `Sending createTenant gRPC request: ${JSON.stringify(data)}`,
    );

    try {
      // Create the tenant
      const tenantResponse = await firstValueFrom<TenantResponse>(
        this.tenantService.createTenant(data),
      );

      // Now create a token for user creation with the tenant's schema
      if (tenantResponse && tenantResponse.schemaName) {
        try {
          const tokenResponse: TokenResponse =
            await this.tokenService.createUserToken(
              tenantResponse.schemaName,
              data.contactEmail,
            );

          // Add the token to the tenant response
          tenantResponse.activationToken = tokenResponse.token;

          this.logger.debug(
            `Created activation token for tenant ${tenantResponse.id}`,
          );
        } catch (tokenError: unknown) {
          if (tokenError instanceof Error) {
            const errorInfo = getErrorInfo(tokenError);
            this.logger.error(
              `Failed to create activation token: ${errorInfo.message}`,
              errorInfo.stack,
            );
          } else {
            this.logger.error(
              'Failed to create activation token: Unknown error type',
            );
          }
        }
      }

      return tenantResponse;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC createTenant error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw error;
    }
  }

  async getTenantById(data: GetTenantByIdRequest): Promise<TenantResponse> {
    this.logger.debug(`Sending getTenantById gRPC request for ID: ${data.id}`);

    try {
      const response = await firstValueFrom(
        this.tenantService.getTenantById(data),
      );
      this.logger.debug(`Received getTenantById gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC getTenantById error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('Tenant', data.id);
      }

      throw error;
    }
  }

  async getAllTenants(): Promise<TenantsResponse> {
    this.logger.debug('Sending getAllTenants gRPC request');

    try {
      const response = await firstValueFrom(
        this.tenantService.getAllTenants({}),
      );
      this.logger.debug(
        `Received getAllTenants gRPC response with ${response.tenants.length} tenants`,
      );
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC getAllTenants error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw error;
    }
  }

  async activateTenant(data: TenantIdRequest): Promise<TenantResponse> {
    this.logger.debug(`Sending activateTenant gRPC request for ID: ${data.id}`);

    try {
      const response = await firstValueFrom(
        this.tenantService.activateTenant(data),
      );
      this.logger.debug(`Received activateTenant gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC activateTenant error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isNotFoundException(error)) {
        throw error;
      } else if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('Tenant', data.id);
      }

      throw error;
    }
  }

  async deactivateTenant(data: TenantIdRequest): Promise<TenantResponse> {
    this.logger.debug(
      `Sending deactivateTenant gRPC request for ID: ${data.id}`,
    );

    try {
      const response = await firstValueFrom(
        this.tenantService.deactivateTenant(data),
      );
      this.logger.debug(`Received deactivateTenant gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC deactivateTenant error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isNotFoundException(error)) {
        throw error;
      } else if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('Tenant', data.id);
      }

      throw error;
    }
  }

  async updateContactInfo(
    data: UpdateContactInfoRequest,
  ): Promise<TenantResponse> {
    this.logger.debug(
      `Sending updateContactInfo gRPC request for ID: ${data.id}`,
    );

    try {
      const response = await firstValueFrom(
        this.tenantService.updateContactInfo(data),
      );
      this.logger.debug(`Received updateContactInfo gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC updateContactInfo error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      } else if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('Tenant', data.id);
      }

      throw error;
    }
  }
}
