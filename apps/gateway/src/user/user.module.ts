import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SharedModule } from '@app/shared';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserMapper } from './mapper/user.mapper';
import { TokenModule } from '../token/token.module';
import { GrpcClientFactory } from '../common/grpc-client.factory';

@Module({
  imports: [
    SharedModule,
    TokenModule,
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'resido',
            protoPath: configService.get('PROTO_PATH'),
            url: `${configService.get('RESIDO_APP_HOST')}:${configService.get('RESIDO_APP_PORT')}`,
          },
        }),
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserMapper, GrpcClientFactory],
})
export class UserModule {}
