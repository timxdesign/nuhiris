import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakAdminService } from '../services/keycloak-admin.service';

const mockConfigGet = jest.fn((key: string) => {
  const values: Record<string, string> = {
    'keycloak.baseUrl': 'http://localhost:8080',
    'keycloak.realm': 'nuhiris',
    'keycloak.clientId': 'nuhiris-api',
    'keycloak.clientSecret': 'test-secret',
  };
  return values[key];
});

describe('KeycloakAdminService', () => {
  let service: KeycloakAdminService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new KeycloakAdminService({ get: mockConfigGet } as unknown as ConfigService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('exchangeCredentials', () => {
    it('returns token response on success', async () => {
      const tokenResponse = {
        access_token: 'mock-access-token',
        expires_in: 900,
        refresh_token: 'mock-refresh',
        refresh_expires_in: 604800,
        token_type: 'Bearer',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(tokenResponse),
      });

      const result = await service.exchangeCredentials('admin', 'password');
      expect(result.access_token).toBe('mock-access-token');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/nuhiris/protocol/openid-connect/token',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws UnauthorizedException on failed auth', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(service.exchangeCredentials('bad', 'creds')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('returns new token on valid refresh', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access',
            expires_in: 900,
            refresh_token: 'new-refresh',
            refresh_expires_in: 604800,
            token_type: 'Bearer',
          }),
      });

      const result = await service.refreshAccessToken('old-refresh');
      expect(result.access_token).toBe('new-access');
    });

    it('throws UnauthorizedException on expired refresh', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(service.refreshAccessToken('expired')).rejects.toThrow(UnauthorizedException);
    });
  });
});
