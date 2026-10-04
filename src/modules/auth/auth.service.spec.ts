import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '@/prisma/prisma.service';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'coach.karim@gmail.com',
    passwordHash: '$2b$10$hashedpassword',
    role: UserRole.PRESCRIBER,
    createdAt: new Date('2026-09-20T12:00:00.000Z'),
    updatedAt: new Date('2026-09-20T12:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as unknown as PrismaService;

    jwtService = {
      sign: vi.fn().mockReturnValue('mocked-jwt-token'),
    } as unknown as JwtService;

    service = new AuthService(prisma, jwtService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'coach.karim@gmail.com',
      password: 'StrongPassword123!',
      role: UserRole.PRESCRIBER,
    };

    it('should register a new user and return token and user profile', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('$2b$10$hashedpassword' as never);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      } as never);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user.email).toBe('coach.karim@gmail.com');
      expect(result.user.role).toBe(UserRole.PRESCRIBER);
      expect(bcrypt.hash).toHaveBeenCalledWith('StrongPassword123!', 10);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'coach.karim@gmail.com',
      password: 'StrongPassword123!',
    };

    it('should login successfully with valid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as never);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
