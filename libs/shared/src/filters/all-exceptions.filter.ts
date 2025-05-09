import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

// Importera alla domain exceptions
import {
  DomainException,
  ValidationException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  SchemaCreationException,
  InternalServerException,
} from '../exceptions/domain.exceptions';

// Importera hjälpfunktioner för error-hantering
import {
  getErrorInfo,
  isDomainException,
  isNotFoundException,
  isValidationException,
} from '../exceptions/error-utils';
import { mapDomainToGrpcException } from '../exceptions/grpc.exception';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Observable<any> | void {
    const contextType = host.getType();

    // Logga alla fel
    this.logException(exception);

    if (contextType === 'http') {
      return this.handleHttpException(exception, host);
    } else if (contextType === 'rpc') {
      return this.handleRpcException(exception);
    } else {
      super.catch(exception, host);
    }
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: Record<string, any> = {};

    // HTTP Exception från NestJS
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Använd tydlig typning för exceptionResponse
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorResponse = exceptionResponse as {
          message?: string | string[];
          error?: string;
          details?: Record<string, any>;
        };

        // Hantera både string och string[] för message
        if (Array.isArray(errorResponse.message)) {
          message = errorResponse.message.join(', ');
        } else if (typeof errorResponse.message === 'string') {
          message = errorResponse.message;
        } else {
          message = exception.message;
        }

        // Säkerställ att error är en sträng
        if (typeof errorResponse.error === 'string') {
          errorCode = errorResponse.error;
        }

        // Inkludera eventuella detaljer
        if (errorResponse.details) {
          details = errorResponse.details;
        }
      } else {
        message = exception.message;
      }
    }
    // Domän-specifika fel
    else if (exception instanceof DomainException) {
      message = exception.message;

      // Mappa olika domänfel till HTTP-statuskoder och felkoder
      if (exception instanceof ValidationException) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
        // Lägg till valideringsfel i detaljer om de finns
        if (exception.errors) {
          details = { validationErrors: exception.errors };
        }
      } else if (exception instanceof NotFoundException) {
        status = HttpStatus.NOT_FOUND;
        errorCode = 'NOT_FOUND';
      } else if (exception instanceof UnauthorizedException) {
        status = HttpStatus.UNAUTHORIZED;
        errorCode = 'UNAUTHORIZED';
      } else if (exception instanceof ConflictException) {
        status = HttpStatus.CONFLICT;
        errorCode = 'CONFLICT';
      } else if (exception instanceof SchemaCreationException) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'SCHEMA_CREATION_ERROR';
      } else if (exception instanceof InternalServerException) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'INTERNAL_SERVER_ERROR';
      }
    }
    // Standard Error objekt
    else if (exception instanceof Error) {
      message = exception.message;

      // Mappa olika namngivna fel till HTTP-statuskoder
      if (exception.name === 'ValidationException') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
      } else if (exception.name === 'NotFoundException') {
        status = HttpStatus.NOT_FOUND;
        errorCode = 'NOT_FOUND';
      } else if (exception.name === 'UnauthorizedException') {
        status = HttpStatus.UNAUTHORIZED;
        errorCode = 'UNAUTHORIZED';
      } else if (exception.name === 'ConflictException') {
        status = HttpStatus.CONFLICT;
        errorCode = 'CONFLICT';
      }
    }

    const responseBody = {
      statusCode: status,
      errorCode,
      message,
      details: Object.keys(details).length > 0 ? details : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(responseBody);
  }

  private handleRpcException(exception: unknown): Observable<never> {
    // Om vi redan har en RpcException, kasta den direkt
    if (exception instanceof RpcException) {
      return throwError(() => exception);
    }

    // Om det är en domänundantag, använda vår hjälpfunktion
    if (exception instanceof DomainException) {
      return throwError(() => mapDomainToGrpcException(exception));
    }

    // Hantera standard Error-objekt
    if (exception instanceof Error) {
      const code = 'INTERNAL';
      const message = exception.message;
      const details: Record<string, any> = { stack: exception.stack };

      // Mappa domänfel till gRPC-koder baserat på felnamn
      const errorCodeMap: Record<string, string> = {
        ValidationException: 'INVALID_ARGUMENT',
        NotFoundException: 'NOT_FOUND',
        UnauthorizedException: 'UNAUTHENTICATED',
        ConflictException: 'ALREADY_EXISTS',
      };

      const errorCode = errorCodeMap[exception.name] || code;

      return throwError(
        () =>
          new RpcException({
            code: errorCode,
            message,
            details,
          }),
      );
    }

    // Okända fel
    return throwError(
      () =>
        new RpcException({
          code: 'INTERNAL',
          message: 'Unknown internal error',
          details: { originalError: String(exception) },
        }),
    );
  }

  private logException(exception: unknown): void {
    const errorInfo = getErrorInfo(exception);

    // Olika loggnivåer beroende på feltyp
    if (isNotFoundException(exception)) {
      // Not Found-fel är ofta normala så vi loggar dessa som warnings
      this.logger.warn(`${errorInfo.name}: ${errorInfo.message}`);
    } else if (isValidationException(exception)) {
      // Valideringsfel är också vanliga, logga dem som warnings med detaljer
      this.logger.warn(
        `${errorInfo.name}: ${errorInfo.message}`,
        errorInfo.details,
      );
    } else if (isDomainException(exception)) {
      // Andra domänfel loggar vi som errors
      this.logger.error(
        `${errorInfo.name}: ${errorInfo.message}`,
        errorInfo.stack,
      );
    } else if (exception instanceof Error) {
      // Standardfel
      const errorMessage = `${exception.name}: ${exception.message}`;
      this.logger.error(errorMessage, exception.stack);
    } else {
      // Okända fel
      this.logger.error('An unknown error occurred', String(exception));
    }
  }
}
