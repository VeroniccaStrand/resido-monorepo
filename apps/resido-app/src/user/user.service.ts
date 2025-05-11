import {
  LoggerService,
  getErrorInfo,
  isDomainException,
  InternalServerException,
  ValidationException,
} from '@app/shared';
import { User } from './domain/user.domain';
import { UserRepository } from './infrastructure/user.repository';
import { UserFactory } from './infrastructure/user.factory';
import { PasswordService } from './password.service';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userFactory: UserFactory,
    private readonly eventEmitter: EventEmitter2,
    private readonly passwordService: PasswordService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserService');
  }

  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
    schemaName: string;
  }): Promise<User> {
    try {
      this.logger.log(`Creating user with email: ${data.email}`);
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ValidationException(
          `User with email ${data.email} already exists`,
        );
      }

      // Validera lösenord
      if (!data.password || data.password.length < 8) {
        throw new ValidationException('Password must be at least 8 characters');
      }

      // Skapa användardomänobjekt med factory
      const user = this.userFactory.createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      // Hasha lösenord
      const passwordHash = await this.passwordService.hashPassword(
        data.password,
      );

      // Spara användare
      const createdUser = await this.userRepository.create(user, passwordHash);

      this.logger.log(`User created: ${createdUser.email}`);

      this.eventEmitter.emit('user.created', {
        userId: user.id,
        email: user.email,
        schemaName: data.schemaName,
      });
      this.logger.log(`Emitted user.created for ${user.email}`);

      return createdUser;
    } catch (error) {
      const errorInfo = getErrorInfo(error);

      this.logger.error(
        `User creation failed for ${data.email}`,
        errorInfo.stack,
        { email: data.email },
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to create user: ${errorInfo.message}`,
      );
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new ValidationException(`User not found with id: ${id}`);
      }
      return user;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to get user by ID: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to get user: ${errorInfo.message}`,
      );
    }
  }

  async updateUserInfo(
    id: string,
    data: {
      firstName: string;
      lastName: string;
      phone?: string;
    },
  ): Promise<User> {
    try {
      const user = await this.getUserById(id);
      user.updateContactInfo(data.firstName, data.lastName, data.phone);
      return this.userRepository.save(user);
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to update user info: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to update user info: ${errorInfo.message}`,
      );
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Validera lösenord
      if (!newPassword || newPassword.length < 8) {
        throw new ValidationException(
          'New password must be at least 8 characters',
        );
      }

      const user = await this.getUserById(id);

      // Hämta nuvarande lösenordshash
      const currentHash = await this.userRepository.getPasswordHash(
        user.id as string,
      );
      if (!currentHash) {
        throw new ValidationException('User has no password set');
      }

      // Validera nuvarande lösenord
      const isMatch = await this.passwordService.comparePasswords(
        currentPassword,
        currentHash,
      );

      if (!isMatch) {
        throw new ValidationException('Current password is incorrect');
      }

      // Hasha nytt lösenord och spara
      const newHash = await this.passwordService.hashPassword(newPassword);
      await this.userRepository.updatePasswordHash(user.id as string, newHash);

      this.logger.log(`Password changed for user: ${user.email}`);
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to change password for user: ${id}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to change password: ${errorInfo.message}`,
      );
    }
  }

  async activateUser(id: string): Promise<User> {
    try {
      const user = await this.getUserById(id);
      user.activate();
      return this.userRepository.save(user);
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to activate user: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to activate user: ${errorInfo.message}`,
      );
    }
  }

  async deactivateUser(id: string): Promise<User> {
    try {
      const user = await this.getUserById(id);
      user.deactivate();
      return this.userRepository.save(user);
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to deactivate user: ${id}`, errorInfo.stack);

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to deactivate user: ${errorInfo.message}`,
      );
    }
  }

  async recordUserLogin(id: string): Promise<User> {
    try {
      const user = await this.getUserById(id);
      user.recordLogin();
      return this.userRepository.save(user);
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to record login for user: ${id}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to record login: ${errorInfo.message}`,
      );
    }
  }
}
