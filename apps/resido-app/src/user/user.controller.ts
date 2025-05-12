import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateUserRequest,
  UserIdRequest,
  UpdateUserInfoRequest,
  ChangePasswordRequest,
  UserResponse,
  Empty,
} from '../../../../libs/shared/src/proto-gen/resido';

import { UserService } from './user.service';
import { UserMapper } from './infrastructure/user.mapper';
import { Metadata } from '@grpc/grpc-js';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
  ) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(
    request: CreateUserRequest,
    metadata: Metadata,
  ): Promise<UserResponse> {
    const schemaArr = metadata.get('schema-name');
    const schemaName =
      Array.isArray(schemaArr) && schemaArr.length
        ? String(schemaArr[0])
        : 'public';

    const user = await this.userService.createUser({
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      password: request.password,
      phone: request.phone,
      schemaName,
    });

    return this.userMapper.toResponse(user);
  }

  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(request: UserIdRequest): Promise<UserResponse> {
    const user = await this.userService.getUserById(request.id);
    return this.userMapper.toResponse(user);
  }

  @GrpcMethod('UserService', 'UpdateUserInfo')
  async updateUserInfo(request: UpdateUserInfoRequest): Promise<UserResponse> {
    const user = await this.userService.updateUserInfo(request.id, {
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
    });
    return this.userMapper.toResponse(user);
  }

  @GrpcMethod('UserService', 'ChangePassword')
  async changePassword(request: ChangePasswordRequest): Promise<Empty> {
    await this.userService.changePassword(
      request.id,
      request.currentPassword,
      request.newPassword,
    );
    return {};
  }

  @GrpcMethod('UserService', 'ActivateUser')
  async activateUser(request: UserIdRequest): Promise<UserResponse> {
    const user = await this.userService.activateUser(request.id);
    return this.userMapper.toResponse(user);
  }

  @GrpcMethod('UserService', 'DeactivateUser')
  async deactivateUser(request: UserIdRequest): Promise<UserResponse> {
    const user = await this.userService.deactivateUser(request.id);
    return this.userMapper.toResponse(user);
  }

  @GrpcMethod('UserService', 'RecordUserLogin')
  async recordUserLogin(request: UserIdRequest): Promise<UserResponse> {
    const user = await this.userService.recordUserLogin(request.id);
    return this.userMapper.toResponse(user);
  }
}
