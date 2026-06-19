import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { IJwtPayload } from '@nuhiris/shared-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const jwksUrl = config.get<string>('keycloak.jwksUrl')!;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: jwksUrl,
      }),
      algorithms: ['RS256'],
    });
  }

  validate(payload: Record<string, unknown>): IJwtPayload {
    return {
      sub: payload['sub'] as string,
      roles: (payload['roles'] as string[]) ?? [],
      facilityId: (payload['facility_id'] as string) ?? null,
      providerId: (payload['provider_id'] as string) ?? null,
      iat: payload['iat'] as number,
      exp: payload['exp'] as number,
      jti: (payload['jti'] as string) ?? '',
    };
  }
}
