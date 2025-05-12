import { SetMetadata } from '@nestjs/common';

export const PUBLIC_SCHEMA_KEY = 'public_schema';
export const UsePublicSchema = () => SetMetadata(PUBLIC_SCHEMA_KEY, true);
