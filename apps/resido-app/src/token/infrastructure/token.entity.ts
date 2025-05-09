import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { TokenType } from '../domain/token.domain';

@Entity({ tableName: 'tokens', schema: 'public' })
export class TokenEntity {
  @PrimaryKey({ autoincrement: true })
  id: string;

  @Property()
  @Index()
  token: string;

  @Enum(() => TokenType)
  type: TokenType;

  @Property({ fieldName: 'expires_at' })
  expiresAt: Date;

  @Property({ fieldName: 'is_used' })
  isUsed: boolean = false;

  @Property({ type: 'jsonb' })
  metadata: Record<string, any> = {};

  @Property({ fieldName: 'created_at' })
  createdAt: Date = new Date();

  @Property({ fieldName: 'updated_at' })
  updatedAt: Date = new Date();
}
