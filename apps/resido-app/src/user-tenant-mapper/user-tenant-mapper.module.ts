import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SharedModule } from '@app/shared';
import { UserTenantMapperEntity } from './infrastructure/user-tenant-mapper.entity';
import { UserTenantMapperController } from './user-tenant-mapper.controller';
import { UserTenantMapperService } from './user-tenant-mapper.service';
import { UserTenantMapperRepository } from './infrastructure/user-tenant-mapper.repository';
import { UserTenantMapperFactory } from './infrastructure/user-tenant-mapper.factory';
import { UserTenantMapperMapper } from './infrastructure/user-tenant-mapper.mapper';
import { SchemaHashService } from './schema-hash.service';
import { UserTenantMapperListener } from './infrastructure/user-tenant-mapper.listener';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserTenantMapperEntity], 'public'),
    SharedModule,
  ],
  controllers: [UserTenantMapperController],
  providers: [
    UserTenantMapperService,
    UserTenantMapperRepository,
    UserTenantMapperFactory,
    UserTenantMapperMapper,
    SchemaHashService,
    UserTenantMapperListener,
  ],
  exports: [UserTenantMapperService],
})
export class UserTenantMapperModule {}
