import { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { createTestApp } from './helpers/create-test-app';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockUsers: Array<{
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const mockPrismaService = {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.email) {
          return Promise.resolve(mockUsers.find((u) => u.email === where.email) || null);
        }
        if (where.id) {
          return Promise.resolve(mockUsers.find((u) => u.id === where.id) || null);
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const newUser = {
          id: `user-${Date.now()}`,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role || UserRole.PRESCRIBER,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockUsers.push(newUser);
        return Promise.resolve(newUser);
      }),
    },
  };

  beforeAll(async () => {
    // Seed an initial user
    const hash = await bcrypt.hash('InitialPassword123!', 10);
    mockUsers.push({
      id: 'existing-user-uuid',
      email: 'existing@example.com',
      passwordHash: hash,
      role: UserRole.BRAND_MANAGER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const adminHash = await bcrypt.hash('AdminPassword123!', 10);
    mockUsers.push({
      id: 'admin-user-uuid',
      email: 'superadmin@example.com',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    app = await createTestApp({ mockPrisma: mockPrismaService });
  });

  afterAll(async () => {
    await app.close();
  });

  let registeredToken = '';

  it('POST /api/auth/register should create a user and return access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'newcoach@nutrifit.com',
        password: 'StrongPassword123!',
        role: UserRole.PRESCRIBER,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('newcoach@nutrifit.com');
    expect(res.body.data.user.role).toBe(UserRole.PRESCRIBER);
    registeredToken = res.body.data.accessToken;
  });

  it('POST /api/auth/register should return 409 Conflict when email already exists', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'Password123!',
        role: UserRole.PRESCRIBER,
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(409);
  });

  it('POST /api/auth/login should return 200 and access token with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'existing@example.com',
        password: 'InitialPassword123!',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('existing@example.com');
  });

  it('POST /api/auth/login should return 401 with invalid password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'existing@example.com',
        password: 'WrongPassword!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(401);
  });

  it('GET /api/auth/me should return 401 Unauthorized without token', async () => {
    const res = await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(401);
  });

  it('GET /api/auth/me should return 200 and user profile with valid Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registeredToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('newcoach@nutrifit.com');
    expect(res.body.data.role).toBe(UserRole.PRESCRIBER);
  });

  describe('DTO Validation Rejection (400 Bad Request)', () => {
    it('POST /api/auth/register should return 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-a-valid-email',
          password: 'StrongPassword123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
    });

    it('POST /api/auth/register should return 400 when password is under 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
    });

    it('POST /api/auth/register should return 400 when non-whitelisted property is sent', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'valid2@example.com',
          password: 'StrongPassword123!',
          isSuperAdmin: true, // Non-whitelisted field
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
    });
  });

  describe('RBAC Authorization Rejection (403 Forbidden vs 200 OK)', () => {
    it('GET /api/auth/admin-only should return 403 Forbidden when accessed by PRESCRIBER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${registeredToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(403);
    });

    it('GET /api/auth/admin-only should return 200 OK when accessed by an ADMIN', async () => {
      // 1. Authenticate as ADMIN
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'superadmin@example.com',
          password: 'AdminPassword123!',
        })
        .expect(200);

      const adminToken = loginRes.body.data.accessToken;

      // 2. Call admin-only endpoint with admin token
      const res = await request(app.getHttpServer())
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Administration console accessed successfully');
    });
  });
});
