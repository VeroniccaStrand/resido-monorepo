import { LogMetadata } from './log-metadata.interface';
import { LogPriority } from './log-priority.enum';

export interface ILogger {
  setContext(context: string): this;
  log(message: string, metadata?: LogMetadata): void;
  error(message: string, trace?: string, metadata?: LogMetadata): void;
  warn(message: string, priority?: LogPriority, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
  verbose(message: string, metadata?: LogMetadata): void;
}
