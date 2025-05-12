// src/tenancy/tenancy.module.ts
import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { SchemaContextInterceptor } from './schema-context.interceptor';
import { TenantConnectionManagerService } from './tenant-connection-manager.service';

@Global()
@Module({
  providers: [
    TenantConnectionManagerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SchemaContextInterceptor,
    },
  ],
  exports: [TenantConnectionManagerService],
})
export class TenancyModule {}
