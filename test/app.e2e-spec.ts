import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
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
