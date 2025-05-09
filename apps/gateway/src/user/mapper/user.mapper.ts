import { UserResponse } from '@app/shared/proto-gen/resido';
import { Injectable } from '@nestjs/common';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserMapper {
  toResponseDto(user: UserResponse): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
