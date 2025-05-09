import { User } from '../domain/user.domain';
import { UserEntity } from './user.entity';
import { UserResponse } from '@app/shared/proto-gen/resido'; // Typ från din genererade proto-def

export class UserMapper {
  toDomain(entity: UserEntity): User {
    return new User({
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastLogin: entity.lastLogin,
    });
  }

  toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id as string;
    entity.email = user.email;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.phone = user.phone;
    entity.isActive = user.isActive;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    entity.lastLogin = user.lastLogin;
    return entity;
  }

  toResponse(user: User): UserResponse {
    return {
      id: user.id ?? '',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
