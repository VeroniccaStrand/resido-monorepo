import { Migration } from '@mikro-orm/migrations';

export class Migration20250508173003_init_tenant extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" serial, "email" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "phone" varchar(255) null, "password_hash" varchar(255) not null, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "last_login" timestamptz null, "test1" varchar(255) not null, constraint "users_pkey" primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
  }

}
