import { Injectable } from '@nestjs/common';

@Injectable()
export class SchemaContextService {
  private schemaName: string | null = null;

  setSchema(schemaName: string): void {
    this.schemaName = schemaName;
  }

  getSchemaName(): string | null {
    return this.schemaName;
  }
}
