import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { REQUEST } from '@nestjs/core';
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
import { GrpcClientFactory } from '../common/grpc-client.factory';

interface TenantServiceClient {
  createTenant(data: CreateTenantRequest): Observable<TenantResponse>;
  getTenantById(data: GetTenantByIdRequest): Observable<TenantResponse>;
  getAllTenants(data: object): Observable<TenantsResponse>;
  activateTenant(data: TenantIdRequest): Observable<TenantResponse>;
  deactivateTenant(data: TenantIdRequest): Observable<TenantResponse>;
  updateContactInfo(data: UpdateContactInfoRequest): Observable<TenantResponse>;

  [methodName: string]: (...args: any[]) => Observable<any>;
}

interface RequestWithSchema extends Request {
  schemaName?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantService implements OnModuleInit {
  private tenantService: TenantServiceClient;

  constructor(
    private readonly logger: LoggerService,
    private readonly tokenService: TokenService,
    private readonly grpcClientFactory: GrpcClientFactory,
    @Inject('TENANT_SERVICE') private client: ClientGrpc,
    @Inject(REQUEST) private readonly request: RequestWithSchema,
  ) {
    this.logger.setContext('TenantService');
  }

  onModuleInit() {
    // Använd GrpcClientFactory för att få en proxy med schema metadata
    this.tenantService = this.grpcClientFactory.create<TenantServiceClient>(
      this.client,
      'TenantService',
      this.request,
    );
    this.logger.log('TenantService gRPC client initialized');
  }

  // createTenant är public så vi behöver explicit sätta 'public' schema
  async createTenant(data: CreateTenantRequest): Promise<TenantResponse> {
    this.logger.debug(
      `Sending createTenant gRPC request: ${JSON.stringify(data)}`,
    );

    try {
      // Create the tenant - create en temporär klient med 'public' schema
      const publicRequest = { ...this.request, schemaName: 'public' };
      const publicTenantService =
        this.grpcClientFactory.create<TenantServiceClient>(
          this.client,
          'TenantService',
          publicRequest,
        );

      const tenantResponse = await firstValueFrom<TenantResponse>(
        publicTenantService.createTenant(data),
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
          const errorInfo = getErrorInfo(tokenError);
          this.logger.error(
            `Failed to create activation token: ${errorInfo.message}`,
            errorInfo.stack,
          );
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

  // Resterande metoder använder tenantService med request-objektets schemaName
  // Inga ändringar behövs i dessa metoder - GrpcClientFactory hanterar schemaName automatiskt
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
