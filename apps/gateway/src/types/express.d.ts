import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      schemaName?: string;
      userEmail?: string;
      userId?: string;
    }
  }
}
