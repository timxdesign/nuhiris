import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UserRole } from '@nuhiris/shared-types';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verifySync: jest.fn(),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  const mockAuthService = {
    login: jest.fn(),
    verifyMfa: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    setupMfa: jest.fn(),
    confirmMfaSetup: jest.fn(),
    removeMfa: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
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
    it('returns tokens on valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
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
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'Password1!' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.username).toBe('admin');
    });

    it('returns MFA challenge when MFA is enabled', async () => {
      mockAuthService.login.mockResolvedValue({
        mfaRequired: true,
        mfaSessionToken: 'mfa-session-123',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'Password1!' })
        .expect(200);

      expect(res.body.mfaRequired).toBe(true);
      expect(res.body).toHaveProperty('mfaSessionToken');
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new tokens on valid refresh token', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-jwt',
        refreshToken: 'new-refresh',
        expiresIn: 900,
        user: { accountId: 'acc-1', username: 'admin', email: 'a@b.com', role: 'national_admin', facilityId: null, providerId: null, mfaEnabled: false },
      });

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);
    });
  });
});
