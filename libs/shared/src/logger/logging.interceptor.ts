import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const contextType = context.getType();
    let requestInfo: string;

    if (contextType === 'http') {
      // Explicit typning för att undvika eslint-fel
      const httpContext = context.switchToHttp();
      const request = httpContext.getRequest<Request>();

      // Nu är request korrekt typad som Express.Request
      requestInfo = `${request.method} ${request.url}`;
    } else if (contextType === 'rpc') {
      // För RPC, använd bara klassnamn och metodnamn
      const className = context.getClass().name;
      const handlerName = context.getHandler().name;
      requestInfo = `RPC: ${className}.${handlerName}`;
    } else {
      // För andra kontexter
      const className = context.getClass().name;
      const handlerName = context.getHandler().name;
      requestInfo = `${className}.${handlerName}`;
    }

    this.logger.log(`Request started: ${requestInfo}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(`Request completed: ${requestInfo} [${duration}ms]`);
        },
        error: (error: Error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `Request failed: ${requestInfo} [${duration}ms]`,
            error.stack,
          );
        },
      }),
    );
  }
}
