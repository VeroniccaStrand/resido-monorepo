import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { LoggerService, getErrorInfo, isDomainException } from '@app/shared';
import {
  CreateTokenRequest,
  TokenResponse,
  TokenValidationResponse,
  UseTokenRequest,
  UseTokenResponse,
  ValidateTokenRequest,
} from '@app/shared/proto-gen/resido';

interface TokenServiceClient {
  createUserToken(data: CreateTokenRequest): Observable<TokenResponse>;
  validateToken(
    data: ValidateTokenRequest,
  ): Observable<TokenValidationResponse>;
  useToken(data: UseTokenRequest): Observable<UseTokenResponse>;
}

@Injectable()
export class TokenService implements OnModuleInit {
  private tokenService: TokenServiceClient;

  constructor(
    private readonly logger: LoggerService,
    @Inject('TOKEN_SERVICE') private client: ClientGrpc,
  ) {
    this.logger.setContext('TokenService');
  }

  onModuleInit() {
    this.tokenService =
      this.client.getService<TokenServiceClient>('TokenService');
    this.logger.log('TokenService gRPC client initialized');
  }

  async createUserToken(
    schemaName: string,
    email: string,
  ): Promise<TokenResponse> {
    this.logger.debug(
      `Creating user token for ${email} in schema ${schemaName}`,
    );

    try {
      return await firstValueFrom(
        this.tokenService.createUserToken({ schemaName, email }),
      );
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC createUserToken error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) throw error;
      throw error;
    }
  }

  async validateToken(token: string): Promise<TokenValidationResponse> {
    this.logger.debug(`Validating token: ${token}`);

    try {
      return await firstValueFrom(this.tokenService.validateToken({ token }));
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC validateToken error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) throw error;
      throw error;
    }
  }

  async useToken(token: string): Promise<UseTokenResponse> {
    this.logger.debug(`Using token: ${token}`);

    try {
      return await firstValueFrom(this.tokenService.useToken({ token }));
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC useToken error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) throw error;
      throw error;
    }
  }
}
