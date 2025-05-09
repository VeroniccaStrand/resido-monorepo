import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { UserEntity } from '../user/infrastructure/user.entity';

const tenantConfig: Options = {
  driver: PostgreSqlDriver,
  user: process.env.DB_USER || 'strand',
  password: process.env.DB_PASSWORD || '123qwe',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  dbName: process.env.DB_NAME || 'resido',
  debug: false,

  entities: [UserEntity],

  migrations: {
    path: './migrations/compiled-migrations',
    pathTs: './migrations/tenant',
  },
};

export default tenantConfig;
