import { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    $runCommandRaw: vi
      .fn()
      .mockRejectedValue(new Error('Use the mongodb provider to use $runCommandRaw')),
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeAll(async () => {
    app = await createTestApp({ mockPrisma: mockPrismaService });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET) should return 200 and database status up', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.info.database.status).toBe('up');
      });
  });

  it('/api/health (GET) should return 503 when database is unreachable', () => {
    mockPrismaService.$queryRawUnsafe.mockRejectedValueOnce(
      new Error('PostgreSQL connection terminated'),
    );

    return request(app.getHttpServer())
      .get('/api/health')
      .expect(503)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.statusCode).toBe(503);
      });
  });
});
