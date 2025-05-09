import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { SharedModule } from '@app/shared';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TokenMapper } from 'apps/resido-app/src/token/infrastructure/token.mapper';
import { TokenGuard } from './token.guard';

@Module({
  imports: [
    SharedModule,
    ClientsModule.registerAsync([
      {
        name: 'TOKEN_SERVICE',
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
  controllers: [TokenController],
  providers: [TokenService, TokenMapper, TokenGuard],
  exports: [TokenService],
})
export class TokenModule {}
