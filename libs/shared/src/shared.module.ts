import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';

import { LoggerModule } from './logger/logger.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    ConfigModule,
  ],
  providers: [SharedService, ConfigService],
  exports: [SharedService, LoggerModule, ConfigService],
})
export class SharedModule {}
