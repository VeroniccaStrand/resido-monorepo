import { Injectable } from '@nestjs/common';
import {
  LoggerService,
  ValidationException,
  InternalServerException,
  getErrorInfo,
  isDomainException,
} from '@app/shared';
import { UserTenantMapperRepository } from './infrastructure/user-tenant-mapper.repository';
import { UserTenantMapperFactory } from './infrastructure/user-tenant-mapper.factory';
import { UserTenantMapper } from './domain/user-tenant-mapper.domain';
import { UserTenantMapperMapper } from './infrastructure/user-tenant-mapper.mapper';
import { SchemaHashService } from './schema-hash.service';

@Injectable()
export class UserTenantMapperService {
  constructor(
    private readonly userTenantMapperRepository: UserTenantMapperRepository,
    private readonly userTenantMapperFactory: UserTenantMapperFactory,
    private readonly userTenantMapperMapper: UserTenantMapperMapper,
    private readonly schemaHashService: SchemaHashService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('UserTenantMapperService');
  }

  async createMapping(data: {
    email: string;
    schemaName: string;
  }): Promise<UserTenantMapper> {
    try {
      this.logger.log(`Creating tenant mapping for email: ${data.email}`);

      const existingMapping = await this.userTenantMapperRepository.findByEmail(
        data.email,
      );
      if (existingMapping) {
        this.logger.log(`Mapping already exists for email: ${data.email}`);
        return existingMapping;
      }

      const mapper = this.userTenantMapperFactory.createUserTenantMapper({
        email: data.email,
        schemaName: data.schemaName,
      });

      const createdMapper =
        await this.userTenantMapperRepository.create(mapper);

      this.logger.log(`Tenant mapping created for email: ${data.email}`);

      return createdMapper;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(
        `Failed to create tenant mapping for ${data.email}`,
        errorInfo.stack,
        { email: data.email, schemaName: data.schemaName },
      );

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to create tenant mapping: ${errorInfo.message}`,
      );
    }
  }

  async getSchemaByEmail(email: string): Promise<string> {
    try {
      this.logger.log(`Getting schema for email: ${email}`);

      const mapper = await this.userTenantMapperRepository.findByEmail(email);
      if (!mapper) {
        throw new ValidationException(
          `Schema mapping not found for email: ${email}`,
        );
      }

      // Dekryptera schemanamnet med rätt metod
      const schemaName = this.schemaHashService.decryptSchemaName(
        mapper.hashedSchemaName,
      );

      this.logger.log(`Schema found for email: ${email}`);
      return schemaName;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      this.logger.error(`Failed to get schema for ${email}`, errorInfo.stack, {
        email,
      });

      if (isDomainException(error)) {
        throw error;
      }

      throw new InternalServerException(
        `Failed to get schema: ${errorInfo.message}`,
      );
    }
  }
}
