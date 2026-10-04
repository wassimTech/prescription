import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '@/prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-id-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    createdAt: new Date('2026-09-20T12:00:00.000Z'),
  };

  beforeEach(() => {
    configService = {
      get: vi.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    prisma = {
      user: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService;

    strategy = new JwtStrategy(configService, prisma);
  });

  it('should validate and return user when user exists in DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);

    const payload = {
      sub: 'user-id-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id-1' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  });

  it('should throw UnauthorizedException when user does not exist in DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const payload = {
      sub: 'deleted-user-id',
      email: 'deleted@example.com',
      role: UserRole.PRESCRIBER,
    };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});
