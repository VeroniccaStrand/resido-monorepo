import { Migration } from '@mikro-orm/migrations';

export class Migration20250511155027_user_tenant_mapper extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user_tenant_mappers" ("id" serial primary key, "email" varchar(255) not null, "hashed_schema_name" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "user_tenant_mappers" add constraint "user_tenant_mappers_email_unique" unique ("email");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "user_tenant_mappers" cascade;`);
  }

}
