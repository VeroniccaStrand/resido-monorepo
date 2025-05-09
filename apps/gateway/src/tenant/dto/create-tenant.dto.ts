import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Corporation',
    minLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Tenant name must be at least 3 characters' })
  name: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@acme.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  contactEmail: string;
}
