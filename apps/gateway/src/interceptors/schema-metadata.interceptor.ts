import { LoggerService } from '@app/shared';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    schemaName?: string;
  };
  schemaName?: string;
}

@Injectable()
export class SchemaMetadataInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('SchemaMetadataInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    if (req.user && req.user.schemaName) {
      req.schemaName = req.user.schemaName;
      this.logger.log(`Injected schema name in request: ${req.schemaName}`);
    } else {
      this.logger.log('No schema name available, will use public schema');
    }

    return next.handle();
  }
}
