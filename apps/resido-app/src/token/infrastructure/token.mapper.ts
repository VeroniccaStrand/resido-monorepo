import { Injectable } from '@nestjs/common';
import { Token, TokenMetadata } from '../domain/token.domain';
import { TokenEntity } from './token.entity';

@Injectable()
export class TokenMapper {
  toDomain(entity: TokenEntity): Token {
    return new Token({
      id: entity.id,
      token: entity.token,
      type: entity.type,
      expiresAt: entity.expiresAt,
      isUsed: entity.isUsed,
      metadata: entity.metadata as TokenMetadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  toEntity(domain: Token): TokenEntity {
    const entity = new TokenEntity();
    entity.token = domain.token;
    entity.type = domain.type;
    entity.expiresAt = domain.expiresAt;
    entity.isUsed = domain.isUsed;
    entity.metadata = domain.metadata;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }

  updateEntity(entity: TokenEntity, domain: Token): void {
    entity.isUsed = domain.isUsed;
    entity.updatedAt = domain.updatedAt;
  }
}
