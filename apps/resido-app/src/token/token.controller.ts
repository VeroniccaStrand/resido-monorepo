import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TokenService } from './token.service';
import { UsePublicSchema } from '../tenancy/public-schema.decorator';
import {
  CreateTokenRequest,
  TokenResponse,
  TokenValidationResponse,
  UseTokenRequest,
  UseTokenResponse,
  ValidateTokenRequest,
} from '@app/shared/proto-gen/resido';

@UsePublicSchema()
@Controller()
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @GrpcMethod('TokenService', 'CreateUserToken')
  async createUserToken(request: CreateTokenRequest): Promise<TokenResponse> {
    const token = await this.tokenService.createUserCreationToken(
      request.schemaName,
      request.email,
    );

    return {
      token: token.token,
      expiresAt: token.expiresAt.toISOString(),
    };
  }

  @GrpcMethod('TokenService', 'ValidateToken')
  async validateToken(
    request: ValidateTokenRequest,
  ): Promise<TokenValidationResponse> {
    const token = await this.tokenService.validateToken(request.token);

    if (!token) {
      return {
        valid: false,
        schemaName: '',
        email: '',
        tokenType: '',
      };
    }

    return {
      valid: true,
      schemaName: token.getSchemaName() || '',
      email: token.getEmail() || '',
      tokenType: token.type,
    };
  }

  @GrpcMethod('TokenService', 'UseToken')
  async useToken(request: UseTokenRequest): Promise<UseTokenResponse> {
    const result = await this.tokenService.useToken(request.token);

    return {
      success: !!result,
    };
  }
}
