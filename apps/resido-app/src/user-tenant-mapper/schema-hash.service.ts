import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SchemaHashService {
  private readonly ENCRYPTION_KEY =
    process.env.SCHEMA_ENCRYPTION_KEY || 'zHp2E8mNxB7qLcKjT5sRvY3wF9gA4dV6';
  private readonly IV_LENGTH = 16;

  cryptSchemaName(schemaName: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY),
      iv,
    );
    let encrypted = cipher.update(schemaName, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptSchemaName(encryptedSchemaName: string): string {
    const parts = encryptedSchemaName.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY),
      iv,
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
