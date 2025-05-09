import { ApiProperty } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the tenant',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the tenant',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiProperty({
    description: 'Schema name for the tenant database',
    example: 'tenant_acme',
  })
  schemaName: string;

  @ApiProperty({
    description: 'Is the tenant active',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Contact email for the tenant',
    example: 'contact@acme.com',
  })
  contactEmail: string;

  @ApiProperty({
    description: 'Contact phone for the tenant',
    example: '+1234567890',
    required: false,
  })
  contactPhone?: string;

  @ApiProperty({
    description: 'When the tenant was created',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'When the tenant was last updated',
    example: '2023-01-01T12:00:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Token for tenant activation',
    example: '1a2b3c4d5e6f7g8h9i0j',
    required: false,
  })
  activationToken?: string;
}
