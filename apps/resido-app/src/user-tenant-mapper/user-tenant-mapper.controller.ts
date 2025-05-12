import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserTenantMapperService } from './user-tenant-mapper.service';
import { LoggerService } from '@app/shared';
import {
  GetSchemaByEmailRequest,
  UserTenantMapperResponse,
} from '@app/shared/proto-gen/resido';
import { Public } from 'apps/resido-app/decorators/public.decorator';
@Public()
@Controller()
export class UserTenantMapperController {
  constructor(
    private readonly userTenantMapperService: UserTenantMapperService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserTenantMapperController');
  }

  @GrpcMethod('UserTenantMapperService', 'GetSchemaByEmail')
  async getSchemaByEmail(
    request: GetSchemaByEmailRequest,
  ): Promise<UserTenantMapperResponse> {
    this.logger.log(`GRPC Request: GetSchemaByEmail for ${request.email}`);

    const schemaName = await this.userTenantMapperService.getSchemaByEmail(
      request.email,
    );

    return { schemaName: schemaName };
  }
}
