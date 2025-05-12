import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { LoggerService, getErrorInfo } from '@app/shared';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserInfoDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserMapper } from './mapper/user.mapper';
import { TokenGuard } from '../token/token.guard';
import { Request } from 'express';
import { Public } from '../common/public.decorator';
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserController');
  }

  @Post()
  @Public()
  @UseGuards(TokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Req() request: Request,
  ): Promise<UserResponseDto> {
    const schemaName = request.schemaName;

    if (!schemaName) {
      throw new Error('Schema name not found in request');
    }

    this.logger.log(
      `Creating user: ${createUserDto.email} in schema: ${schemaName}`,
    );

    try {
      const grpcResponse = await this.userService.createUser(
        createUserDto,
        schemaName,
      );
      const response = this.userMapper.toResponseDto(grpcResponse);
      this.logger.log(`User created successfully with ID: ${response.id}`);
      return response;
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to create user: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.debug(`Fetching user with ID: ${id}`);
    try {
      const grpcResponse = await this.userService.getUserById({ id });
      return this.userMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to fetch user: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User information updated successfully',
    type: UserResponseDto,
  })
  async updateUserInfo(
    @Param('id') id: string,
    @Body() dto: UpdateUserInfoDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user ID: ${id}`);
    try {
      const grpcResponse = await this.userService.updateUserInfo({
        id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      });
      return this.userMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to update user info: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Put(':id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a user' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User activated successfully',
    type: UserResponseDto,
  })
  async activateUser(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Activating user ID: ${id}`);
    try {
      const grpcResponse = await this.userService.activateUser({ id });
      return this.userMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to activate user: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Put(':id/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deactivated successfully',
    type: UserResponseDto,
  })
  async deactivateUser(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user ID: ${id}`);
    try {
      const grpcResponse = await this.userService.deactivateUser({ id });
      return this.userMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to deactivate user: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }

  @Put(':id/record-login')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record user login' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login recorded successfully',
    type: UserResponseDto,
  })
  async recordUserLogin(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Recording login for user ID: ${id}`);
    try {
      const grpcResponse = await this.userService.recordUserLogin({ id });
      return this.userMapper.toResponseDto(grpcResponse);
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to record login: ${errorInfo.message}`,
        errorInfo.stack,
      );
      throw error;
    }
  }
}
