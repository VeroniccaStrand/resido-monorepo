import { Injectable } from '@nestjs/common';
import { LoggerService } from '@app/shared';
import { TenantConnectionManagerService } from '../../tenancy/tenant-connection-manager.service';
import { User } from '../domain/user.domain';
import { UserEntity } from './user.entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserRepository {
  constructor(
    private readonly tenantConnectionManager: TenantConnectionManagerService,
    private readonly mapper: UserMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserRepository');
  }

  async create(user: User, passwordHash: string): Promise<User> {
    // Här används runWithCurrentSchema som automatiskt hämtar schema från AsyncLocalStorage
    return this.tenantConnectionManager.runWithCurrentSchema(async (em) => {
      const entity = this.mapper.toEntity(user);
      entity.passwordHash = passwordHash;

      await em.persistAndFlush(entity);
      this.logger.log(`User record created: ${entity.id}`);

      return this.mapper.toDomain(entity);
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.tenantConnectionManager.runWithCurrentSchema(async (em) => {
      const entity = await em.findOne(UserEntity, { id });
      if (!entity) return null;
      return this.mapper.toDomain(entity);
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.tenantConnectionManager.runWithCurrentSchema(async (em) => {
      const entity = await em.findOne(UserEntity, { email });
      if (!entity) return null;
      return this.mapper.toDomain(entity);
    });
  }

  async save(user: User): Promise<User> {
    return this.tenantConnectionManager.runWithCurrentSchema(async (em) => {
      const entity = await em.findOne(UserEntity, { id: user.id });

      if (!entity) {
        throw new Error(
          `Cannot save user: Entity with id ${user.id} not found`,
        );
      }

      entity.firstName = user.firstName;
      entity.lastName = user.lastName;
      entity.phone = user.phone;
      entity.isActive = user.isActive;
      entity.updatedAt = user.updatedAt;
      entity.lastLogin = user.lastLogin;

      await em.flush();

      return user;
    });
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    return this.tenantConnectionManager.runWithCurrentSchema(async (em) => {
      const entity = await em.findOne(UserEntity, { id: userId });
      if (!entity) return null;
      return entity.passwordHash;
    });
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    return this.tenantConnectionManager.runWithCurrentSchema(async (em) => {
      const entity = await em.findOne(UserEntity, { id: userId });

      if (!entity) {
        throw new Error(`User with id ${userId} not found`);
      }

      entity.passwordHash = passwordHash;
      await em.flush();
    });
  }
}
