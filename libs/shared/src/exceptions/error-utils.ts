import {
  DomainException,
  ValidationException,
  NotFoundException,
} from './domain.exceptions';

export interface ErrorInfo {
  message: string;
  stack?: string;
  name?: string;
  details?: Record<string, any>;
}

export function getErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const info: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };

    if (error instanceof ValidationException && error.errors) {
      info.details = { errors: error.errors };
    } else if (typeof error === 'object' && error !== null) {
      const potentialErrorsContainer = error as {
        errors?: Record<string, string[]>;
      };
      if (potentialErrorsContainer.errors) {
        info.details = { errors: potentialErrorsContainer.errors };
      }
    }

    return info;
  }

  return {
    message: String(error),
  };
}

export function isDomainException(error: unknown): error is DomainException {
  return error instanceof DomainException;
}

export function isNotFoundException(
  error: unknown,
): error is NotFoundException {
  return error instanceof NotFoundException;
}

export function isValidationException(
  error: unknown,
): error is ValidationException {
  return error instanceof ValidationException;
}
