import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse = {
    accessToken: 'sample-jwt-token',
    user: {
      id: 'user-id-1',
      email: 'brand@nutrifit.com',
      role: UserRole.BRAND_MANAGER,
      createdAt: new Date('2026-09-20T12:00:00.000Z'),
    },
  };

  beforeEach(() => {
    authService = {
      register: vi.fn().mockResolvedValue(mockAuthResponse),
      login: vi.fn().mockResolvedValue(mockAuthResponse),
    } as unknown as AuthService;

    controller = new AuthController(authService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a new user', async () => {
    const dto = {
      email: 'brand@nutrifit.com',
      password: 'StrongPassword123!',
      role: UserRole.BRAND_MANAGER,
    };

    const result = await controller.register(dto);

    expect(result).toEqual(mockAuthResponse);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('should login an existing user', async () => {
    const dto = {
      email: 'brand@nutrifit.com',
      password: 'StrongPassword123!',
    };

    const result = await controller.login(dto);

    expect(result).toEqual(mockAuthResponse);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('should return current user profile on getProfile', async () => {
    const userProfile = mockAuthResponse.user;

    const result = await controller.getProfile(userProfile);

    expect(result).toEqual(userProfile);
  });
});
