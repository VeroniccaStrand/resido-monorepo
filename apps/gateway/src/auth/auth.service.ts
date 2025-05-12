// apps/gateway/src/auth/auth.service.ts
import { LoggerService } from '@app/shared';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';

// Definiera interfaces för typesäkerhet
interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface SchemaResponse {
  schema_name: string;
}

interface UserService {
  verifyCredentials(data: {
    email: string;
    password: string;
  }): Observable<UserResponse>;
}

interface UserTenantMapperService {
  getSchemaByEmail(data: { email: string }): Observable<SchemaResponse>;
}

@Injectable()
export class AuthService {
  private userService: UserService;
  private userTenantMapperService: UserTenantMapperService;

  constructor(
    @Inject('AUTH_SERVICE') private client: ClientGrpc,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  onModuleInit() {
    this.userService = this.client.getService<UserService>('UserService');
    this.userTenantMapperService =
      this.client.getService<UserTenantMapperService>(
        'UserTenantMapperService',
      );
  }

  async login(loginDto: LoginDto) {
    try {
      this.logger.log(`Login attempt for user: ${loginDto.email}`);

      // Steg 1: Verifiera användaruppgifter mot user service (public schema)
      const user = await firstValueFrom(
        this.userService.verifyCredentials({
          email: loginDto.email,
          password: loginDto.password,
        }),
      );

      if (!user || !user.id) {
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`User ${loginDto.email} authenticated successfully`);

      // Steg 2: Hämta schemanamn för denna användare från user-tenant-mapper
      const schemaResponse = await firstValueFrom(
        this.userTenantMapperService.getSchemaByEmail({
          email: loginDto.email,
        }),
      );

      const schemaName = schemaResponse.schema_name;
      this.logger.log(
        `Retrieved schema name for ${loginDto.email}: ${schemaName}`,
      );

      // Steg 3: Skapa JWT med användarinformation OCH schemanamn
      const payload = {
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        schemaName: schemaName, // VIKTIGT: Inkludera schemanamn i token
      };

      const token = this.jwtService.sign(payload);
      this.logger.log(`Generated JWT token for user ${loginDto.email}`);

      // Skicka tillbaka token och användarinfo till klienten
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Login failed for ${loginDto.email}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
