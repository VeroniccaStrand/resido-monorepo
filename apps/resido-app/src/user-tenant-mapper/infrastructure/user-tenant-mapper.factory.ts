import { Injectable } from '@nestjs/common';
import { UserTenantMapper } from '../domain/user-tenant-mapper.domain';
import { SchemaHashService } from '../schema-hash.service';

@Injectable()
export class UserTenantMapperFactory {
  constructor(private readonly schemaHashService: SchemaHashService) {}

  createUserTenantMapper(props: {
    email: string;
    schemaName: string;
  }): UserTenantMapper {
    const hashedSchemaName = this.schemaHashService.cryptSchemaName(
      props.schemaName,
    );

    return new UserTenantMapper({
      email: props.email,
      hashedSchemaName,
    });
  }
}
