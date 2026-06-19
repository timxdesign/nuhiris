import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { APP_GUARD } from '@nestjs/core';
import { UserRole } from '@nuhiris/shared-types';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authService: Partial<AuthService>;

  beforeAll(async () => {
    authService = {
      login: jest.fn(),
      verifyMfa: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      setupMfa: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: APP_GUARD, useValue: { canActivate: () => true } },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      const mockResponse = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        user: {
          accountId: 'acc-1',
          username: 'admin',
          email: 'admin@test.com',
          role: UserRole.NATIONAL_ADMIN,
          facilityId: null,
          providerId: null,
          mfaEnabled: false,
        },
      };
      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const res = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ username: 'admin', password: 'Password1!' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.username).toBe('admin');
    });

    it('returns MFA challenge when MFA is enabled', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        mfaRequired: true,
        mfaSessionToken: 'mfa-session-123',
      });

      const res = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ username: 'admin', password: 'Password1!' })
        .expect(200);

      expect(res.body.mfaRequired).toBe(true);
      expect(res.body).toHaveProperty('mfaSessionToken');
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new tokens on valid refresh token', async () => {
      const mockResponse = {
        accessToken: 'new-jwt',
        refreshToken: 'new-refresh',
        expiresIn: 900,
        user: { accountId: 'acc-1', username: 'admin', email: 'a@b.com', role: 'national_admin', facilityId: null, providerId: null, mfaEnabled: false },
      };
      (authService.refresh as jest.Mock).mockResolvedValue(mockResponse);

      await request(app.getHttpServer() as Server)
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);
    });
  });

  describe('GET /auth/me', () => {
    it('returns user profile', async () => {
      (authService.getProfile as jest.Mock).mockResolvedValue({
        accountId: 'acc-1',
        username: 'admin',
        email: 'admin@test.com',
        role: UserRole.NATIONAL_ADMIN,
        mfaEnabled: false,
      });

      const res = await request(app.getHttpServer() as Server)
        .get('/auth/me')
        .set('Authorization', 'Bearer fake-token')
        .expect(200);

      expect(res.body).toHaveProperty('username', 'admin');
    });
  });
});
