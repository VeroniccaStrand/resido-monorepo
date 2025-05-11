import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TenantEntity } from '../tenant/infrastructure/tenant.entity';
import { TokenEntity } from '../token/infrastructure/token.entity';

import { UserTenantMapperEntity } from '../user-tenant-mapper/infrastructure/user-tenant-mapper.entity';

const publicConfig: Options = {
  driver: PostgreSqlDriver,
  user: process.env.DB_USER || 'strand',
  password: process.env.DB_PASSWORD || '123qwe',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  dbName: process.env.DB_NAME || 'resido',

  entities: [TenantEntity, TokenEntity, UserTenantMapperEntity],
  schema: 'public',
  migrations: {
    path: './migrations/public',
    pathTs: './migrations/public',
  },
};

export default publicConfig;
