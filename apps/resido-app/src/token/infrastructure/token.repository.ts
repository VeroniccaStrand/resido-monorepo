import { Injectable } from '@nestjs/common';
import { Token } from '../domain/token.domain';
import { TokenEntity } from './token.entity';
import { TokenMapper } from './token.mapper';
import { LoggerService } from '@app/shared';
import { TenantConnectionManagerService } from '../../tenancy/tenant-connection-manager.service';

@Injectable()
export class TokenRepository {
  constructor(
    private readonly tenantConnectionManager: TenantConnectionManagerService,
    private readonly tokenMapper: TokenMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TokenRepository');
  }

  async createToken(token: Token): Promise<Token> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = this.tokenMapper.toEntity(token);
      await em.persistAndFlush(entity);
      this.logger.log(`Token created: ${entity.id} (${entity.type})`);
      return this.tokenMapper.toDomain(entity);
    });
  }

  async findByTokenValue(tokenValue: string): Promise<Token | null> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = await em.findOne(TokenEntity, { token: tokenValue });
      if (!entity) return null;
      return this.tokenMapper.toDomain(entity);
    });
  }

  async save(token: Token): Promise<Token> {
    return this.tenantConnectionManager.runWithPublicSchema(async (em) => {
      const entity = await em.findOne(TokenEntity, { id: token.id });
      if (!entity) {
        throw new Error(
          `Cannot update token: Entity with id ${token.id} not found`,
        );
      }
      this.tokenMapper.updateEntity(entity, token);
      await em.flush();
      return token;
    });
  }
}
