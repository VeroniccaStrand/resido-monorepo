import { RpcException } from '@nestjs/microservices';
import { NotFoundException, ValidationException } from './domain.exceptions';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

export interface GrpcErrorDetails {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class GrpcException extends RpcException {
  constructor(details: GrpcErrorDetails) {
    super(details);
    this.name = 'GrpcException';
    Object.setPrototypeOf(this, GrpcException.prototype);
  }
}

// Mappning av domänfel till gRPC-koder
export function mapDomainToGrpcException(error: Error): GrpcException {
  let code = 'INTERNAL';
  let details: Record<string, any> = {};

  if (error instanceof ValidationException) {
    code = 'INVALID_ARGUMENT';
    details = { validationErrors: error.errors };
  } else if (error instanceof NotFoundException) {
    code = 'NOT_FOUND';
  } else if (error instanceof UnauthorizedException) {
    code = 'UNAUTHENTICATED';
  } else if (error instanceof ConflictException) {
    code = 'ALREADY_EXISTS';
  }

  return new GrpcException({
    code,
    message: error.message,
    details: { ...details, stack: error.stack },
  });
}
