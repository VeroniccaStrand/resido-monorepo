"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20250508173738_edit_test1 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20250508173738_edit_test1 extends migrations_1.Migration {
    async up() {
        this.addSql(`alter table "users" alter column "test1" type varchar(255) using ("test1"::varchar(255));`);
        this.addSql(`alter table "users" alter column "test1" drop not null;`);
    }
    async down() {
        this.addSql(`alter table "users" alter column "test1" type varchar(255) using ("test1"::varchar(255));`);
        this.addSql(`alter table "users" alter column "test1" set not null;`);
    }
}
exports.Migration20250508173738_edit_test1 = Migration20250508173738_edit_test1;
