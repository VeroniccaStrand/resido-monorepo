import { Global, Module } from '@nestjs/common';

import { LoggerModule } from '@app/shared';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SchemaConnectionService } from './schema-connection.service';
import { SchemaInterceptor } from './schema.interceptor';
import { SchemaContextService } from './schema-context.service';

@Global()
@Module({
  imports: [LoggerModule],
  controllers: [],
  providers: [
    SchemaContextService,
    SchemaConnectionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SchemaInterceptor,
    },
  ],
  exports: [SchemaContextService, SchemaConnectionService],
})
export class TenancyModule {}
