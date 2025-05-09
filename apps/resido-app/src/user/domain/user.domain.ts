export class User {
  private _id?: string;
  private _email: string;
  private _firstName: string;
  private _lastName: string;
  private _phone?: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLogin?: Date;
  private _test1?: string;
  constructor(props: {
    id?: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    lastLogin?: Date;
    test1?: string;
  }) {
    this._id = props.id;
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._phone = props.phone;
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._lastLogin = props.lastLogin;
    this._test1 = props.test1;

    this.validate();
  }

  private validate(): void {
    if (!this._email || !this.isValidEmail(this._email)) {
      throw new Error('Invalid email format');
    }

    if (!this._firstName || this._firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters');
    }

    if (!this._lastName || this._lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  updateContactInfo(firstName: string, lastName: string, phone?: string): void {
    if (firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters');
    }

    if (lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters');
    }

    this._firstName = firstName;
    this._lastName = lastName;
    this._phone = phone;
    this._updatedAt = new Date();
  }

  recordLogin(): void {
    this._lastLogin = new Date();
    this._updatedAt = new Date();
  }

  get id(): string | undefined {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastLogin(): Date | undefined {
    return this._lastLogin;
  }
}
