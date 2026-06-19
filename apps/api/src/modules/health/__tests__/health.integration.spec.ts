import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';
import { HealthModule } from '../health.module';

describe('HealthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200 with status ok', () => {
    return request(app.getHttpServer() as Server)
      .get('/health/live')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
      });
  });

  it('GET /health/ready returns 200', () => {
    return request(app.getHttpServer() as Server)
      .get('/health/ready')
      .expect(200);
  });

  it('GET /health/startup returns 200', () => {
    return request(app.getHttpServer() as Server)
      .get('/health/startup')
      .expect(200);
  });
});
