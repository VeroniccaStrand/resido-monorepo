import { Injectable } from '@nestjs/common';
import { Token, TokenType, TokenMetadata } from '../domain/token.domain';

@Injectable()
export class TokenFactory {
  createUserCreationToken(schemaName: string, email: string): Token {
    const metadata: TokenMetadata = {
      schemaName,
      email,
    };

    return new Token({
      type: TokenType.USER_CREATION,
      metadata,
    });
  }
}
