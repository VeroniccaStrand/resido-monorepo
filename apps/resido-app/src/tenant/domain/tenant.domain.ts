export class Tenant {
  private _id?: string;
  private _name: string;
  private _schemaName: string;
  private _contactEmail: string;
  private _contactPhone?: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    id?: string;
    name: string;
    schemaName: string;
    contactEmail: string;
    contactPhone?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._name = props.name;
    this._schemaName = props.schemaName;
    this._contactEmail = props.contactEmail;
    this._contactPhone = props.contactPhone;
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    this.validate();
  }

  private validate(): void {
    if (!this._name || this._name.trim().length < 3) {
      throw new Error('Tenant name must be at least 3 characters');
    }

    if (!this._schemaName || !this.isValidSchemaName(this._schemaName)) {
      throw new Error('Invalid schema name format');
    }

    if (!this._contactEmail || !this.isValidEmail(this._contactEmail)) {
      throw new Error('Invalid contact email');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidSchemaName(schemaName: string): boolean {
    return /^[a-z0-9_]+$/.test(schemaName);
  }

  setSchemaName(schemaName: string): void {
    if (!this.isValidSchemaName(schemaName)) {
      throw new Error('Invalid schema name format');
    }
    this._schemaName = schemaName;
    this._updatedAt = new Date();
  }

  // Domänmetoder
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  updateContactInfo(email: string, phone?: string): void {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    this._contactEmail = email;
    this._contactPhone = phone;
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get schemaName(): string | undefined {
    return this._schemaName;
  }

  get contactEmail(): string {
    return this._contactEmail;
  }

  get contactPhone(): string | undefined {
    return this._contactPhone;
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
}
