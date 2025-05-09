import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'tenants', schema: 'public' })
export class TenantEntity {
  @PrimaryKey({ autoincrement: true })
  id: string;

  @Property()
  name: string;

  @Property({ fieldName: 'schema_name' })
  schemaName: string;

  @Property({ fieldName: 'contact_email' })
  contactEmail: string;

  @Property({ fieldName: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Property({ fieldName: 'is_active' })
  isActive: boolean = true;

  @Property({ fieldName: 'created_at' })
  createdAt: Date = new Date();

  @Property({ fieldName: 'updated_at' })
  updatedAt: Date = new Date();
}
