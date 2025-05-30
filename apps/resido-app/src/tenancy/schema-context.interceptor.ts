import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { LoggerService, LogPriority } from '@app/shared';
import { ConfigService } from '@nestjs/config';
import { TenantConnectionManagerService } from './tenant-connection-manager.service';
import { PUBLIC_KEY } from 'apps/resido-app/decorators/public.decorator';

interface GrpcMetadata {
  get?(key: string): string | string[] | undefined;
}

@Injectable()
export class SchemaContextInterceptor implements NestInterceptor {
  private readonly SCHEMA_NAME_REGEX = /^[a-z][a-z0-9_]{4,62}$/;
  private readonly FORBIDDEN_PREFIXES = [
    'pg_',
    'postgres',
    'information_schema',
  ];
  private readonly DEFAULT_SCHEMA = 'public';

  constructor(
    private readonly tenantConnectionManager: TenantConnectionManagerService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.logger.setContext('SchemaContextInterceptor');
  }

  async intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const controllerName = ctx.getClass().name;
    const handlerName = ctx.getHandler().name;

    if (ctx.getType() !== 'rpc') {
      throw new Error('This interceptor only supports gRPC contexts');
    }

    this.logger.debug('Processing gRPC request', {
      controller: controllerName,
      method: handlerName,
    });

    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug(
        'Endpoint is public (@Public decorator), using default schema',
        {
          controller: controllerName,
          method: handlerName,
          schema: this.DEFAULT_SCHEMA,
        },
      );

      return await this.tenantConnectionManager.runInTenantContext(
        this.DEFAULT_SCHEMA,
        // eslint-disable-next-line @typescript-eslint/require-await
        async () => next.handle(),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rpcContext = ctx.switchToRpc().getContext();
    const schemaName = this.extractSchemaFromMetadata(
      rpcContext as Record<string, unknown>,
    );

    if (!schemaName) {
      const errorMsg = 'Missing schema-name in gRPC metadata';
      this.logger.warn(errorMsg, LogPriority.P1);
      throw new BadRequestException(errorMsg);
    }

    this.validateSchemaName(schemaName);

    this.logger.debug('Using schema for gRPC request', {
      schemaName,
      controller: controllerName,
      method: handlerName,
    });

    return await this.tenantConnectionManager.runInTenantContext(
      schemaName,
      // eslint-disable-next-line @typescript-eslint/require-await
      async () => next.handle(),
    );
  }

  private extractSchemaFromMetadata(
    rpcContext: Record<string, unknown>,
  ): string | null {
    try {
      const metadata = rpcContext as GrpcMetadata;

      try {
        this.logger.debug(
          `RPC CONTEXT keys: ${Object.keys(rpcContext).join(', ')}`,
        );
      } catch (err) {
        this.logger.warn(`Could not stringify rpcContext keys: ${String(err)}`);
      }

      //!! Debuggar namn - ta bort.
      if (metadata && typeof metadata.get === 'function') {
        let schemaValue: string | string[] | undefined;

        schemaValue = metadata.get('schema-name');
        if (schemaValue) {
          if (Array.isArray(schemaValue) && schemaValue.length > 0) {
            return schemaValue[0];
          }
          if (typeof schemaValue === 'string') {
            return schemaValue;
          }
        }

        schemaValue = metadata.get('schemaName');
        if (schemaValue) {
          if (Array.isArray(schemaValue) && schemaValue.length > 0) {
            return schemaValue[0];
          }
          if (typeof schemaValue === 'string') {
            return schemaValue;
          }
        }

        schemaValue = metadata.get('schema_name');
        if (schemaValue) {
          if (Array.isArray(schemaValue) && schemaValue.length > 0) {
            return schemaValue[0];
          }
          if (typeof schemaValue === 'string') {
            return schemaValue;
          }
        }

        if (this.configService.get<string>('NODE_ENV') !== 'production') {
          const testResults = {
            'schema-name': metadata.get('schema-name') ? 'exists' : 'null',
            schemaName: metadata.get('schemaName') ? 'exists' : 'null',
            schema_name: metadata.get('schema_name') ? 'exists' : 'null',
            SCHEMA_NAME: metadata.get('SCHEMA_NAME') ? 'exists' : 'null',
          };

          this.logger.debug(
            `gRPC metadata tests: ${JSON.stringify(testResults, null, 2)}`,
          );

          this.logger.debug('gRPC metadata received', {
            hasSchemaName: false,
            availableKeys: Object.keys(metadata).join(', '),
          });
        }
      } else {
        this.logger.warn(
          'Invalid or unsupported gRPC metadata format',
          LogPriority.P1,
        );
      }

      if (typeof rpcContext.schemaName === 'string' && rpcContext.schemaName) {
        return rpcContext.schemaName;
      }

      if (
        typeof rpcContext['schema-name'] === 'string' &&
        rpcContext['schema-name']
      ) {
        return rpcContext['schema-name'];
      }

      return null;
    } catch (debugError) {
      const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const errorMessage =
        debugError instanceof Error ? debugError.message : String(debugError);
      const errorStack =
        debugError instanceof Error ? debugError.stack : undefined;

      this.logger.error(
        'Error extracting schema from gRPC metadata',
        errorStack,
        {
          errorId,
          errorMessage,
        },
      );
      return null;
    }
  }

  private validateSchemaName(schemaName: string): void {
    if (!this.SCHEMA_NAME_REGEX.test(schemaName)) {
      const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.logger.warn('Invalid schema name format', LogPriority.P0, {
        errorId,
        schemaName,
      });
      throw new BadRequestException(
        `Invalid schema name format: ${schemaName} (Ref: ${errorId})`,
      );
    }

    if (
      this.FORBIDDEN_PREFIXES.some((prefix) => schemaName.startsWith(prefix))
    ) {
      const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.logger.warn('Forbidden schema prefix detected', LogPriority.P0, {
        errorId,
        schemaName,
      });
      throw new BadRequestException(
        `Forbidden schema prefix: ${schemaName} (Ref: ${errorId})`,
      );
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
}
