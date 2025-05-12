import {
  Injectable,
  LoggerService as NestLoggerService,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
// Importera korrekt
import 'winston-daily-rotate-file';
import { LogPriority } from '../interfaces/log-priority.enum';
import { LogMetadata } from '../interfaces/log-metadata.interface';

// Definiera typexport för winston-daily-rotate-file
type DailyRotateFileTransportInstance = winston.transport;

interface DailyRotateFileTransportOptions {
  filename: string;
  datePattern: string;
  maxFiles?: string;
  maxSize?: string;
  level?: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;
  private logContext?: string;
  private winstonLogger?: winston.Logger;
  private readonly environment: string;
  private readonly minPriority: LogPriority;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger();
    this.environment = this.configService.get<string>(
      'NODE_ENV',
      'development',
    );

    this.minPriority =
      this.environment === 'production' ? LogPriority.P1 : LogPriority.P3;

    if (this.environment === 'production') {
      this.initializeFileLogging();
    }
  }

  setContext(context: string): this {
    this.logContext = context;
    return this;
  }

  log(message: string, metadata?: LogMetadata): void {
    this.logger.log(this.formatMessage(message, metadata), this.logContext);

    if (this.environment === 'production' && this.winstonLogger) {
      this.winstonLogger.info(message, {
        context: this.logContext,
        ...metadata,
      });
    }
  }

  error(message: string, trace?: string, metadata?: LogMetadata): void {
    this.logger.error(
      this.formatMessage(message, metadata),
      trace,
      this.logContext,
    );

    if (this.winstonLogger) {
      this.winstonLogger.error(message, {
        context: this.logContext,
        trace,
        ...metadata,
      });
    }
  }

  warn(
    message: string,
    priority: LogPriority = LogPriority.P2,
    metadata?: LogMetadata,
  ): void {
    if (this.shouldLogPriority(priority)) {
      this.logger.warn(
        this.formatMessage(message, metadata),
        priority,
        this.logContext,
      );

      if (this.winstonLogger) {
        this.winstonLogger.warn(message, {
          context: this.logContext,
          priority,
          ...metadata,
        });
      }
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (this.environment !== 'production') {
      this.logger.debug(this.formatMessage(message, metadata), this.logContext);
    }
  }

  verbose(message: string, metadata?: LogMetadata): void {
    if (this.environment !== 'production') {
      this.logger.verbose(
        this.formatMessage(message, metadata),
        this.logContext,
      );
    }
  }

  private shouldLogPriority(priority: LogPriority): boolean {
    const priorityOrder = {
      [LogPriority.P0]: 0,
      [LogPriority.P1]: 1,
      [LogPriority.P2]: 2,
      [LogPriority.P3]: 3,
    };

    return priorityOrder[priority] <= priorityOrder[this.minPriority];
  }

  private initializeFileLogging(): void {
    try {
      const logDir = this.configService.get<string>('LOG_DIR', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const transports: winston.transport[] = [];

      const fileRotateOptions: DailyRotateFileTransportOptions = {
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        maxSize: '20m',
      };

      const errorFileOptions: DailyRotateFileTransportOptions = {
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '30d',
        maxSize: '20m',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const transport1 = new (winston.transports as any).DailyRotateFile(
        fileRotateOptions,
      ) as DailyRotateFileTransportInstance;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const transport2 = new (winston.transports as any).DailyRotateFile(
        errorFileOptions,
      ) as DailyRotateFileTransportInstance;

      transports.push(transport1);
      transports.push(transport2);

      this.winstonLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        defaultMeta: {
          service: this.configService.get<string>('SERVICE_NAME', 'resido-app'),
        },
        transports,
      });

      if (this.environment !== 'production') {
        this.winstonLogger.add(
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize file logging', String(error));
    }
  }

  private formatMessage(message: string, metadata?: LogMetadata): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return message;
    }

    const metadataArray: string[] = [];

    for (const [key, value] of Object.entries(metadata)) {
      if (value === undefined) continue;

      let stringValue: string;

      if (value === null) {
        stringValue = 'null';
      } else if (typeof value === 'object') {
        try {
          stringValue = JSON.stringify(value);
        } catch {
          stringValue = '[Complex Object]';
        }
      } else if (typeof value === 'string') {
        stringValue = value;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        stringValue = String(value);
      }

      metadataArray.push(`${key}=${stringValue}`);
    }

    if (metadataArray.length === 0) {
      return message;
    }

    return message + ' | ' + metadataArray.join(', ');
  }
}
