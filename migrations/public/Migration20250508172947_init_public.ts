import { Migration } from '@mikro-orm/migrations';

export class Migration20250508172947_init_public extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "tenants" ("id" serial, "name" varchar(255) not null, "schema_name" varchar(255) not null, "contact_email" varchar(255) not null, "contact_phone" varchar(255) null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "tenants_pkey" primary key ("id"));`);

    this.addSql(`create table "tokens" ("id" serial, "token" varchar(255) not null, "type" text check ("type" in ('user_creation')) not null, "expires_at" timestamptz not null, "is_used" boolean not null default false, "metadata" jsonb not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "tokens_pkey" primary key ("id"));`);
    this.addSql(`create index "tokens_token_index" on "tokens" ("token");`);
  }

}
