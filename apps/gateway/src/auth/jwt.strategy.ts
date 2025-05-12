import { LoggerService } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  schemaName: string;
  iat?: number;
  exp?: number;
}

interface UserInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  schemaName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    } as any);
    this.logger.setContext('JwtStrategy');
  }

  validate(payload: JwtPayload): UserInfo {
    const user: UserInfo = {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      schemaName: payload.schemaName,
    };

    this.logger.log(
      `JWT validated for user ${payload.email} with schema ${payload.schemaName}`,
    );

    return user;
  }
}
