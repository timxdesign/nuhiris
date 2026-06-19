import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  token_type: string;
}

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private readonly tokenUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config: ConfigService) {
    const baseUrl = config.get<string>('keycloak.baseUrl')!;
    const realm = config.get<string>('keycloak.realm')!;
    this.tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
    this.clientId = config.get<string>('keycloak.clientId')!;
    this.clientSecret = config.get<string>('keycloak.clientSecret')!;
  }

  async exchangeCredentials(username: string, password: string): Promise<KeycloakTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username,
      password,
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      this.logger.warn(`Keycloak auth failed for user ${username}: ${response.status}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    return (await response.json()) as KeycloakTokenResponse;
  }

  async refreshAccessToken(refreshToken: string): Promise<KeycloakTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    return (await response.json()) as KeycloakTokenResponse;
  }
}
