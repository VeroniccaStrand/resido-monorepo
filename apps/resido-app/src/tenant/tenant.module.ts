import { Module } from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { TenantController } from './tenant.controller';
import { TenantFactory } from './infrastructure/tenant.factory';
import { TenantMapper } from './infrastructure/tenant.mapper';
import { TenantRepository } from './infrastructure/tenant.repository';
import { TenantMigrationService } from './services/tenant-migration.service';
import { SharedModule } from '@app/shared';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TenantEntity } from './infrastructure/tenant.entity';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([TenantEntity], 'public'),
    SharedModule,
    TokenModule,
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantFactory,
    TenantMapper,
    TenantRepository,
    TenantMigrationService,
  ],
  exports: [TenantService],
})
export class TenantModule {}
