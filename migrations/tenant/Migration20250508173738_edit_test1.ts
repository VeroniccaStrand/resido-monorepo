import { Migration } from '@mikro-orm/migrations';

export class Migration20250508173738_edit_test1 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" alter column "test1" type varchar(255) using ("test1"::varchar(255));`);
    this.addSql(`alter table "users" alter column "test1" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" alter column "test1" type varchar(255) using ("test1"::varchar(255));`);
    this.addSql(`alter table "users" alter column "test1" set not null;`);
  }

}
