import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { SharedModule } from '@app/shared';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TokenEntity } from './infrastructure/token.entity';
import { TokenFactory } from './infrastructure/token.factory';
import { TokenMapper } from './infrastructure/token.mapper';
import { TokenRepository } from './infrastructure/token.repository';

@Module({
  imports: [MikroOrmModule.forFeature([TokenEntity], 'public'), SharedModule],
  controllers: [TokenController],
  providers: [TokenRepository, TokenMapper, TokenFactory, TokenService],
  exports: [TokenService],
})
export class TokenModule {}
