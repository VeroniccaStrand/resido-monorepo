import { ApiProperty } from '@nestjs/swagger';
import { TenantResponseDto } from './tenant-response.dto';

export class TenantsResponseDto {
  @ApiProperty({
    type: [TenantResponseDto],
    description: 'List of tenants',
  })
  tenants: TenantResponseDto[];
}
