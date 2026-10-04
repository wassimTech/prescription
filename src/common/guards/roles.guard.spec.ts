import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (user?: { id: string; role: UserRole }): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce(undefined);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user is not present on request', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce([UserRole.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user does not have required role', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce([UserRole.ADMIN]);
    const context = createMockContext({
      id: 'user-id-1',
      role: UserRole.PRESCRIBER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user has one of the required roles', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce([
      UserRole.ADMIN,
      UserRole.BRAND_MANAGER,
    ]);
    const context = createMockContext({
      id: 'user-id-2',
      role: UserRole.BRAND_MANAGER,
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});
