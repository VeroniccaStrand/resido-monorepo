import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoggerService, getErrorInfo, ErrorInfo } from '@app/shared';
import { SchemaContextService } from './schema-context.service';
import { Reflector } from '@nestjs/core';
import { PUBLIC_SCHEMA_KEY } from './public-schema.decorator';

// Type interfaces for gRPC metadata
interface MetadataContext {
  get(key: string): unknown;
}

function isMetadataContext(obj: unknown): obj is MetadataContext {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'get' in obj &&
    typeof (obj as Record<string, unknown>).get === 'function'
  );
}

interface WithToString {
  toString(): string;
}
function hasToString(obj: unknown): obj is WithToString {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'toString' in obj &&
    typeof (obj as Record<string, unknown>).toString === 'function'
  );
}

function safeToString(obj: unknown): string | null {
  if (hasToString(obj)) {
    const str = obj.toString();
    if (str && str !== '[object Object]') {
      return str;
    }
  }
  return null;
}

interface WithValue {
  value: unknown;
}
function hasValue(obj: unknown): obj is WithValue {
  return obj !== null && typeof obj === 'object' && 'value' in obj;
}

interface WithInternalRepr {
  internalRepr: Record<string, unknown>;
}
function hasInternalRepr(obj: unknown): obj is WithInternalRepr {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'internalRepr' in obj &&
    obj.internalRepr !== null &&
    typeof obj.internalRepr === 'object'
  );
}

@Injectable()
export class SchemaInterceptor implements NestInterceptor {
  constructor(
    private readonly schemaContextService: SchemaContextService,
    private readonly logger: LoggerService,
    private readonly reflector: Reflector,
  ) {
    this.logger.setContext('SchemaInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    try {
      // Default to public
      this.schemaContextService.setSchema('public');

      // Check for @UsePublicSchema
      const usePublicSchema =
        this.reflector.getAllAndOverride<boolean>(PUBLIC_SCHEMA_KEY, [
          context.getHandler(),
          context.getClass(),
        ]) || false;

      if (usePublicSchema) {
        this.logger.debug(
          'Using public schema due to @UsePublicSchema decorator',
        );
        return next.handle();
      }

      if (context.getType() === 'rpc') {
        const rpcContext: unknown = context.switchToRpc().getContext();
        const schemaName = this.extractSchemaName(rpcContext);
        if (schemaName) {
          this.logger.debug(`Using schema from gRPC metadata: ${schemaName}`);
          this.schemaContextService.setSchema(schemaName);
        }
      }
    } catch (error: unknown) {
      const errorInfo: ErrorInfo = getErrorInfo(error);
      this.logger.error(
        `Error in SchemaInterceptor: ${errorInfo.message}`,
        errorInfo.stack,
      );
    }

    return next.handle();
  }

  private extractSchemaName(context: unknown): string | null {
    // Lägg till loggning för att se kontextens struktur
    this.logger.debug(`RPC context type: ${typeof context}`);
    this.logger.debug(`RPC context: ${JSON.stringify(context, null, 2)}`);

    if (!isMetadataContext(context)) {
      this.logger.warn('Context is not a metadata context');
      return null;
    }

    try {
      // Testa olika vanliga metadata-format
      const metadataValue: unknown =
        context.get('schema-name') ||
        context.get('schema_name') ||
        context.get('schemaName');

      this.logger.debug(`Raw metadata value: ${JSON.stringify(metadataValue)}`);

      if (typeof metadataValue === 'string') {
        this.logger.debug(`Found string schema name: ${metadataValue}`);
        return metadataValue;
      }

      if (Buffer.isBuffer(metadataValue)) {
        const bufferStr = metadataValue.toString('utf8');
        this.logger.debug(`Found buffer schema name: ${bufferStr}`);
        return bufferStr;
      }

      // Hantera metadata som ett objekt
      if (metadataValue && typeof metadataValue === 'object') {
        // Array-format från vissa gRPC implementationer
        if (Array.isArray(metadataValue) && metadataValue.length > 0) {
          if (typeof metadataValue[0] === 'string') {
            this.logger.debug(`Found array schema name: ${metadataValue[0]}`);
            return metadataValue[0];
          }

          const str = safeToString(metadataValue[0]);
          if (str) {
            this.logger.debug(`Found array object schema name: ${str}`);
            return str;
          }
        }

        // Fortsätt med övriga objekt-metoder...
        const str = safeToString(metadataValue);
        if (str) {
          this.logger.debug(`Found object toString schema name: ${str}`);
          return str;
        }

        if (hasValue(metadataValue)) {
          const rawValue = metadataValue.value;
          if (typeof rawValue === 'string') {
            this.logger.debug(`Found object.value schema name: ${rawValue}`);
            return rawValue;
          }
          const valueStr = safeToString(rawValue);
          if (valueStr) {
            this.logger.debug(
              `Found object.value toString schema name: ${valueStr}`,
            );
            return valueStr;
          }
        }

        if (hasInternalRepr(metadataValue)) {
          this.logger.debug(
            `InternalRepr keys: ${Object.keys(metadataValue.internalRepr).join(', ')}`,
          );
          for (const [key, value] of Object.entries(
            metadataValue.internalRepr,
          )) {
            if (
              key.includes('schema-name') ||
              key.includes('schema_name') ||
              key.includes('schemaName')
            ) {
              const schemaValue =
                typeof value === 'string' ? value : safeToString(value);
              if (schemaValue) {
                this.logger.debug(
                  `Found internalRepr schema name: ${schemaValue} from key: ${key}`,
                );
                return schemaValue;
              }
            }
          }
        }
      }

      this.logger.warn('Could not extract schema name from metadata');
      return null;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Error extracting schema name: ${errorInfo.message}`,
        errorInfo.stack,
      );
      return null;
    }
  }
}
