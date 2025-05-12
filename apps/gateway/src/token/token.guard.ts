import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { LoggerService } from '@app/shared';
import { Request } from 'express';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TokenGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No token provided in request');
      throw new UnauthorizedException('Authentication token is required');
    }

    this.logger.debug(`Validating token: "${token}"`);

    try {
      const validation = await this.tokenService.validateToken(token);

      if (!validation || !validation.valid) {
        this.logger.warn(`Invalid token: "${token}"`);
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.schemaName = validation.schemaName;

      if ('userId' in validation) {
        request.userId = validation.userId as string;
      }

      if ('email' in validation) {
        request.userEmail = validation.email;
      }

      this.logger.debug(
        `Token validated successfully for schema: ${validation.schemaName}`,
      );

      return true;
    } catch (error: unknown) {
      const typedError = error as Error;
      this.logger.error(
        `Token validation failed: ${typedError.message}`,
        typedError.stack,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    const [type, token] = authHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
