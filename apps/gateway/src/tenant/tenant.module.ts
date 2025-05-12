import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { SharedModule } from '@app/shared';
import { TenantMapper } from './mapper/tenant.mapper';
import { ConfigService } from '@nestjs/config';
import { TokenModule } from '../token/token.module';
import { GrpcClientFactory } from '../common/grpc-client.factory';

@Module({
  imports: [
    SharedModule,
    TokenModule,
    ClientsModule.registerAsync([
      {
        name: 'TENANT_SERVICE',
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
  controllers: [TenantController],
  providers: [TenantService, TenantMapper, GrpcClientFactory],
})
export class TenantModule {}
