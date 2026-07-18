import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { IJwtPayload } from '@nuhiris/shared-types';

function buildOptions(config: ConfigService): StrategyOptionsWithoutRequest {
  const devSecret = config.get<string>('keycloak.devSecret');
  if (devSecret) {
    Logger.warn('Using symmetric JWT_DEV_SECRET — do not use in production', 'JwtStrategy');
    return {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: devSecret,
      algorithms: ['HS256'],
    };
  }
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKeyProvider: passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: config.get<string>('keycloak.jwksUrl')!,
    }),
    algorithms: ['RS256'],
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super(buildOptions(config));
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
