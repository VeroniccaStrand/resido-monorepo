import { Module } from '@nestjs/common';
import { ResidoAppController } from './resido-app.controller';
import { ResidoAppService } from './resido-app.service';
import {
  AllExceptionsFilter,
  LoggingInterceptor,
  SharedModule,
} from '@app/shared';
import { TenantModule } from './tenant/tenant.module';

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TokenModule } from './token/token.module';
import { TenancyModule } from './tenancy/tenancy.module';
import publicConfig from './config/mikro-orm-public.config';
import tenantConfig from './config/mikro-orm-tenant.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserTenantMapperModule } from './user-tenant-mapper/user-tenant-mapper.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    SharedModule,

    MikroOrmModule.forRoot({
      ...publicConfig,
      contextName: 'public',
    }),

    MikroOrmModule.forRoot({
      ...tenantConfig,
      contextName: 'tenant',
    }),

    TenantModule,
    UserModule,
    AuthModule,
    TokenModule,
    TenancyModule,
    UserTenantMapperModule,
  ],
  controllers: [ResidoAppController],
  providers: [
    ResidoAppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class ResidoAppModule {}
