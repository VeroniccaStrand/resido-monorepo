export class UserTenantMapper {
  private _id?: number;
  private _email: string;
  private _hashedSchemaName: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    id?: number;
    email: string;
    hashedSchemaName: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._email = props.email;
    this._hashedSchemaName = props.hashedSchemaName;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    this.validate();
  }

  private validate(): void {
    if (!this._email || !this.isValidEmail(this._email)) {
      throw new Error('Invalid email format');
    }

    if (!this._hashedSchemaName) {
      throw new Error('Hashed schema name is required');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get id(): number | undefined {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get hashedSchemaName(): string {
    return this._hashedSchemaName;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
