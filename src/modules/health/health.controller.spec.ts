import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '@/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let prismaHealth: PrismaHealthIndicator;

  const mockHealthResult = {
    status: 'ok' as const,
    info: { database: { status: 'up' } },
    error: {},
    details: { database: { status: 'up' } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: vi.fn().mockImplementation(async (indicators) => {
              for (const indicator of indicators) {
                await indicator();
              }
              return mockHealthResult;
            }),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: vi.fn().mockResolvedValue({ database: { status: 'up' } }),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaHealth = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check result with database status up', async () => {
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.info?.database?.status).toBe('up');
    expect(healthCheckService.check).toHaveBeenCalled();
    expect(prismaHealth.pingCheck).toHaveBeenCalled();
  });

  it('should propagate error when health check fails', async () => {
    vi.spyOn(healthCheckService, 'check').mockRejectedValueOnce(
      new Error('Database connection failed'),
    );

    await expect(controller.check()).rejects.toThrow('Database connection failed');
  });
});
