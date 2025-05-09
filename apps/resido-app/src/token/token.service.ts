import { Injectable } from '@nestjs/common';
import {
  LoggerService,
  getErrorInfo,
  isDomainException,
  InternalServerException,
} from '@app/shared';
import { Token } from './domain/token.domain';
import { TokenRepository } from './infrastructure/token.repository';
import { TokenFactory } from './infrastructure/token.factory';

@Injectable()
export class TokenService {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly tokenFactory: TokenFactory,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TokenService');
  }

  async createUserCreationToken(
    schemaName: string,
    email: string,
  ): Promise<Token> {
    try {
      const token = this.tokenFactory.createUserCreationToken(
        schemaName,
        email,
      );
      return this.tokenRepository.createToken(token);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to create user creation token for email: ${email}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to create user creation token: ${errorInfo.message}`,
      );
    }
  }

  async validateToken(tokenValue: string): Promise<Token | null> {
    try {
      const token = await this.tokenRepository.findByTokenValue(tokenValue);

      if (!token || !token.isValid()) {
        return null;
      }

      return token;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to validate token: ${tokenValue}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to validate token: ${errorInfo.message}`,
      );
    }
  }

  async useToken(tokenValue: string): Promise<Token | null> {
    try {
      const token = await this.tokenRepository.findByTokenValue(tokenValue);

      if (!token || !token.isValid()) {
        return null;
      }

      token.markAsUsed();
      return this.tokenRepository.save(token);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to use token: ${tokenValue}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to use token: ${errorInfo.message}`,
      );
    }
  }
}
