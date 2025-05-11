import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'user_tenant_mappers' })
export class UserTenantMapperEntity {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ unique: true })
  email: string;

  @Property()
  hashedSchemaName: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
