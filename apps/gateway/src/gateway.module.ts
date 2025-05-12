import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import {
  AllExceptionsFilter,
  LoggingInterceptor,
  SharedModule,
} from '@app/shared';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { AuthModule } from './auth/auth.module';
import { SchemaMetadataInterceptor } from './interceptors/schema-metadata.interceptor';

@Module({
  imports: [SharedModule, TenantModule, UserModule, TokenModule, AuthModule],
  controllers: [GatewayController],
  providers: [
    GatewayService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SchemaMetadataInterceptor,
    },
  ],
})
export class GatewayModule {}
