export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';

    Object.setPrototypeOf(this, DomainException.prototype);
  }
}

export class ValidationException extends DomainException {
  constructor(
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ValidationException';
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}

export class NotFoundException extends DomainException {
  constructor(entity: string, id: string | number) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundException';
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedException';
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

export class ConflictException extends DomainException {
  constructor(entity: string, field: string, value: string | number) {
    super(`${entity} with ${field} ${value} already exists`);
    this.name = 'ConflictException';
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}
export class SchemaCreationException extends DomainException {
  constructor(schemaName: string, message: string) {
    super(`Failed to create schema ${schemaName}: ${message}`);
    this.name = 'SchemaCreationException';
  }
}

export class InternalServerException extends DomainException {
  constructor(message: string) {
    super(`Internal server error: ${message}`);
    this.name = 'InternalServerException';
    Object.setPrototypeOf(this, InternalServerException.prototype);
  }
}
export class MigrationException extends DomainException {
  constructor(
    message: string,
    public readonly tenantId?: string,
    public readonly schema?: string,
  ) {
    super(`Migration error: ${message}`);
    this.name = 'MigrationException';
    Object.setPrototypeOf(this, MigrationException.prototype);
  }
}
export class DatabaseAccessException extends DomainException {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(`Database access error: ${message}`);
    this.name = 'DatabaseAccessException';
    Object.setPrototypeOf(this, DatabaseAccessException.prototype);
  }
}
export class MigrationLockException extends DomainException {
  constructor(message: string) {
    super(`Migration lock error: ${message}`);
    this.name = 'MigrationLockException';
    Object.setPrototypeOf(this, MigrationLockException.prototype);
  }
}
