import * as crypto from 'crypto';

export enum TokenType {
  USER_CREATION = 'user_creation',
}

export interface TokenMetadata {
  schemaName?: string;
  email?: string;
  userId?: string;
  tenantId?: string;
  invitedByUserId?: string;
  [key: string]: string | number | boolean | undefined;
}

export class Token {
  private _id?: string;
  private _token: string;
  private _type: TokenType;
  private _expiresAt: Date;
  private _isUsed: boolean;
  private _metadata: TokenMetadata;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: {
    id?: string;
    token?: string;
    type: TokenType;
    expiresAt?: Date;
    isUsed?: boolean;
    metadata?: TokenMetadata;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._token = props.token || this.generateToken();
    this._type = props.type;
    this._expiresAt = props.expiresAt || this.getDefaultExpiry();
    this._isUsed = props.isUsed || false;
    this._metadata = props.metadata || {};
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  private generateToken(): string {
    const tokenBytes = crypto.randomBytes(32);
    return tokenBytes.toString('hex');
  }

  private getDefaultExpiry(): Date {
    const now = new Date();
    // Default to 7 days expiry
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  isValid(): boolean {
    const now = new Date();
    return !this._isUsed && this._expiresAt > now;
  }

  markAsUsed(): void {
    this._isUsed = true;
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get token(): string {
    return this._token;
  }

  get type(): TokenType {
    return this._type;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get isUsed(): boolean {
    return this._isUsed;
  }

  get metadata(): TokenMetadata {
    return { ...this._metadata };
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Helper methods for specific metadata - now with proper type safety
  getSchemaName(): string | null {
    return this._metadata.schemaName || null;
  }

  getEmail(): string | null {
    return this._metadata.email || null;
  }
}
