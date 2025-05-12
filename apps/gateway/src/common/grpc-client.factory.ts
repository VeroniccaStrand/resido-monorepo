import { LoggerService } from '@app/shared';
import { Metadata } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface RequestWithSchema extends Request {
  schemaName?: string;
}

interface GrpcCallOptions {
  deadline?: Date;
}

interface GrpcService {
  [methodName: string]: (
    request: unknown,
    metadata?: Metadata,
    options?: GrpcCallOptions,
  ) => Observable<unknown>;
}

@Injectable()
export class GrpcClientFactory {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('GrpcClientFactory');
  }

  create<T extends GrpcService>(
    client: ClientGrpc,
    serviceName: string,
    request: RequestWithSchema,
  ): T {
    const service = client.getService<T>(serviceName);

    if (!request.schemaName) {
      this.logger.warn(
        'No schemaName provided in request object – using default service',
      );
      return service;
    }

    this.logger.log(
      `Creating proxied gRPC client for ${serviceName} with schema: ${request.schemaName}`,
    );

    return new Proxy<T>(service, {
      get: (target: T, prop: string | symbol): any => {
        // Skip symbol properties or properties not in target
        if (typeof prop !== 'string' || !(prop in target)) {
          return undefined;
        }

        const original = target[prop as keyof T];
        if (typeof original !== 'function') {
          return original;
        }

        const originalMethod = original as (
          request: unknown,
          metadata?: Metadata,
          options?: GrpcCallOptions,
        ) => Observable<unknown>;

        const proxied = (
          payload: unknown,
          metadataOrOptions?: Metadata | GrpcCallOptions,
          maybeOptions?: GrpcCallOptions,
        ): Observable<unknown> => {
          const meta = new Metadata();
          meta.add('schema-name', request.schemaName!);
          this.logger.debug(`Metadata + schema-name=${request.schemaName}`);

          let callOptions: GrpcCallOptions | undefined;
          if (metadataOrOptions instanceof Metadata) {
            callOptions = maybeOptions;
          } else {
            callOptions = metadataOrOptions;
          }

          if (
            serviceName === 'UserService' &&
            prop === 'createUser' &&
            typeof payload === 'object' &&
            payload !== null
          ) {
            (payload as Record<string, unknown>).__schemaName =
              request.schemaName;
            this.logger.debug(`Added __schemaName to payload`);
          }

          const args: [unknown, Metadata, GrpcCallOptions?] = [payload, meta];
          if (callOptions) {
            args.push(callOptions);
          }

          this.logger.log(`Calling ${serviceName}.${String(prop)}`);
          return originalMethod(...args);
        };

        return proxied;
      },
    });
  }
}
