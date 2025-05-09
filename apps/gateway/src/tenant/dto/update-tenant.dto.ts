import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateContactInfoDto {
  @ApiProperty({
    description: 'Contact email address',
    example: 'new-contact@acme.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  contactEmail: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+46701234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}
