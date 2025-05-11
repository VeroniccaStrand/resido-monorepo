import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService, getErrorInfo } from '@app/shared';
import { UserTenantMapperService } from '../user-tenant-mapper.service';

@Injectable()
export class UserTenantMapperListener {
  constructor(
    private readonly userTenantMapperService: UserTenantMapperService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserTenantMapperListener');
  }

  @OnEvent('user.created')
  async handleUserCreatedEvent(payload: {
    userId: string;
    email: string;
    schemaName: string;
  }) {
    try {
      this.logger.log(`User created event received for ${payload.email}`);

      await this.userTenantMapperService.createMapping({
        email: payload.email,
        schemaName: payload.schemaName,
      });

      this.logger.log(
        `Tenant mapping created successfully for user ${payload.email}`,
      );
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to create tenant mapping for user ${payload.email}`,
        errorInfo.stack,
        {
          userId: payload.userId,
          email: payload.email,
          schemaName: payload.schemaName,
        },
      );
    }
  }
}
