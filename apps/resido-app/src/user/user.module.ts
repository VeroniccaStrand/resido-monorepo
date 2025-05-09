import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PasswordService } from './password.service';
import { UserEntity } from './infrastructure/user.entity';
import { SharedModule } from '@app/shared';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserFactory } from './infrastructure/user.factory';
import { UserMapper } from './infrastructure/user.mapper';
import { UserRepository } from './infrastructure/user.repository';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity], 'tenant'), SharedModule],
  controllers: [UserController],
  providers: [
    UserService,
    PasswordService,
    UserFactory,
    UserMapper,
    UserRepository,
  ],
  exports: [PasswordService, UserService],
})
export class UserModule {}
