export interface LogMetadata {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  schemaName?: string;
  errorId?: string;
  duration?: number;
  [key: string]: unknown;
}
