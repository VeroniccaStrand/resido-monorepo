import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Tenant } from '../domain/tenant.domain';

@Injectable()
export class TenantFactory {
  createTenant(props: { name: string; contactEmail: string }): Tenant {
    const schemaName = this.generateSchemaName();

    return new Tenant({
      name: props.name,
      schemaName,
      contactEmail: props.contactEmail,
    });
  }

  private generateSchemaName(): string {
    const uuid = randomUUID().replace(/-/g, '');

    const shortUuid = uuid.substring(0, 16);

    return `tenant_${shortUuid}`;
  }
}
