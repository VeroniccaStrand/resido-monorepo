import { LoggerService } from '@nestjs/common';

export interface EnhancedLoggerService extends LoggerService {
  setContext(context: string): this;
}
