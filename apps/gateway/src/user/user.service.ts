import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  LoggerService,
  getErrorInfo,
  isDomainException,
  isNotFoundException,
  NotFoundException,
} from '@app/shared';
import {
  CreateUserRequest,
  ChangePasswordRequest,
  UpdateUserInfoRequest,
  UserIdRequest,
  UserResponse,
  Empty,
} from '@app/shared/proto-gen/resido';
import { Metadata } from '@grpc/grpc-js';

interface UserServiceClient {
  createUser(
    data: CreateUserRequest,
    metadata?: Record<string, any>,
  ): Observable<UserResponse>;
  getUserById(data: UserIdRequest): Observable<UserResponse>;
  updateUserInfo(data: UpdateUserInfoRequest): Observable<UserResponse>;
  changePassword(data: ChangePasswordRequest): Observable<Empty>;
  activateUser(data: UserIdRequest): Observable<UserResponse>;
  deactivateUser(data: UserIdRequest): Observable<UserResponse>;
  recordUserLogin(data: UserIdRequest): Observable<UserResponse>;
}

@Injectable()
export class UserService implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(
    private readonly logger: LoggerService,
    @Inject('USER_SERVICE') private client: ClientGrpc,
  ) {
    this.logger.setContext('UserService');
  }

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>('UserService');
    this.logger.log('UserService gRPC client initialized');
  }

  async createUser(
    data: CreateUserRequest,
    schemaName: string,
  ): Promise<UserResponse> {
    this.logger.debug(
      `Sending createUser gRPC request for ${data.email} in schema ${schemaName}`,
    );

    const metadata = new Metadata();
    metadata.add('schema-name', schemaName);

    this.logger.debug(
      `Sending createUser gRPC request with metadata: schema-name=${schemaName}`,
    );

    try {
      const response = await firstValueFrom(
        this.userService.createUser(data, metadata),
      );
      this.logger.debug(
        `Received createUser gRPC response for ${response.email}`,
      );
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC createUser error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) throw error;
      throw error;
    }
  }

  async getUserById(data: UserIdRequest): Promise<UserResponse> {
    this.logger.debug(`Sending getUserById gRPC request for ID: ${data.id}`);

    try {
      const response = await firstValueFrom(this.userService.getUserById(data));
      this.logger.debug(`Received getUserById gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC getUserById error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('User', data.id);
      }

      throw error;
    }
  }

  async updateUserInfo(data: UpdateUserInfoRequest): Promise<UserResponse> {
    this.logger.debug(`Sending updateUserInfo gRPC request for ID: ${data.id}`);

    try {
      const response = await firstValueFrom(
        this.userService.updateUserInfo(data),
      );
      this.logger.debug(`Received updateUserInfo gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC updateUserInfo error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) throw error;
      if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('User', data.id);
      }

      throw error;
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    this.logger.debug(`Sending changePassword gRPC request for ID: ${data.id}`);

    try {
      await firstValueFrom(this.userService.changePassword(data));
      this.logger.debug(`Password changed successfully`);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC changePassword error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isDomainException(error)) throw error;
      if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('User', data.id);
      }

      throw error;
    }
  }

  async activateUser(data: UserIdRequest): Promise<UserResponse> {
    this.logger.debug(`Sending activateUser gRPC request for ID: ${data.id}`);

    try {
      const response = await firstValueFrom(
        this.userService.activateUser(data),
      );
      this.logger.debug(`Received activateUser gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC activateUser error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isNotFoundException(error)) throw error;
      if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('User', data.id);
      }

      throw error;
    }
  }

  async deactivateUser(data: UserIdRequest): Promise<UserResponse> {
    this.logger.debug(`Sending deactivateUser gRPC request for ID: ${data.id}`);

    try {
      const response = await firstValueFrom(
        this.userService.deactivateUser(data),
      );
      this.logger.debug(`Received deactivateUser gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC deactivateUser error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isNotFoundException(error)) throw error;
      if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('User', data.id);
      }

      throw error;
    }
  }

  async recordUserLogin(data: UserIdRequest): Promise<UserResponse> {
    this.logger.debug(
      `Sending recordUserLogin gRPC request for ID: ${data.id}`,
    );

    try {
      const response = await firstValueFrom(
        this.userService.recordUserLogin(data),
      );
      this.logger.debug(`Received recordUserLogin gRPC response`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `gRPC recordUserLogin error: ${errorInfo.message}`,
        errorInfo.stack,
      );

      if (isNotFoundException(error)) throw error;
      if (errorInfo.name === 'NOT_FOUND') {
        throw new NotFoundException('User', data.id);
      }

      throw error;
    }
  }
}
