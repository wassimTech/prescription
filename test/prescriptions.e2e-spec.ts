import { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaService } from '@/prisma/prisma.service';
import { createTestApp } from './helpers/create-test-app';
import { DatabaseTestHelper } from './helpers/database.helper';
import { SupertestHelper } from './helpers/supertest.helper';
import { createValidPrescriptionDto } from './fixtures/e2e-constants';

describe('PrescriptionsController (Real PostgreSQL E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let db: DatabaseTestHelper;
  let client: SupertestHelper;

  beforeAll(async () => {
    // 1. Boot standard NestJS app with REAL PrismaService connected to Docker PostgreSQL
    app = await createTestApp();
    prisma = app.get(PrismaService);
    db = new DatabaseTestHelper(prisma);
    client = new SupertestHelper(app);
  });

  afterAll(async () => {
    // Clean up all test data and close connections cleanly
    await db.cleanDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Fast TRUNCATE CASCADE ensuring 100% test isolation
    await db.cleanDatabase();
  });

  describe('POST /api/prescriptions - Real Database Persistence (201 Created)', () => {
    it('should persist prescription in real PostgreSQL and generate database token', async () => {
      // Given: Real Brand and real Prescriber in PostgreSQL
      const brand = await db.seedBrand();
      const { user, profile } = await db.seedPrescriber();

      const payload = createValidPrescriptionDto({
        brandId: brand.id,
      });

      // When: Prescriber sends creation request
      const res = await client
        .asPrescriber(user.id)
        .post('/api/prescriptions')
        .send(payload)
        .expect(201);

      // Then: API envelope assertions
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.token).toMatch(/^presc_[a-f0-9]{10}$/);
      expect(res.body.data.items).toEqual(payload.items);
      expect(res.body.data.notes).toBe(payload.notes);
      expect(res.body.data.brand.id).toBe(brand.id);

      // CRITICAL REAL E2E ASSERTION: Verify row actually exists in PostgreSQL!
      const persistedRecord = await prisma.prescription.findUnique({
        where: { id: res.body.data.id },
      });

      expect(persistedRecord).toBeDefined();
      expect(persistedRecord?.brandId).toBe(brand.id);
      expect(persistedRecord?.prescriberId).toBe(profile.id);
      expect(persistedRecord?.token).toBe(res.body.data.token);
    });
  });

  describe('POST /api/prescriptions - Security & Authentication (401 Unauthorized)', () => {
    it('should reject request with 401 when Authorization header is missing', async () => {
      // Given: Valid payload but no token
      const brand = await db.seedBrand();
      const payload = createValidPrescriptionDto({ brandId: brand.id });

      // When & Then: Anonymous request rejected
      const res = await client.anonymous().post('/api/prescriptions').send(payload).expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
    });

    it('should reject request with 401 when token is malformed', async () => {
      // Given: Malformed token
      const malformedToken = client.auth.invalidToken();

      // When & Then
      const res = await client
        .withToken(malformedToken)
        .post('/api/prescriptions')
        .send(createValidPrescriptionDto())
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
    });
  });

  describe('POST /api/prescriptions - RBAC Authorization (403 Forbidden)', () => {
    it('should reject request with 403 when called by an ADMIN role', async () => {
      // Given: Real Admin user in database
      const admin = await db.seedAdmin();
      const brand = await db.seedBrand();
      const payload = createValidPrescriptionDto({ brandId: brand.id });

      // When & Then: Prescriber role required
      const res = await client
        .asAdmin(admin.id)
        .post('/api/prescriptions')
        .send(payload)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(403);
    });

    it('should reject request with 403 when called by a BRAND_MANAGER role', async () => {
      // Given: Real Brand Manager user in database
      const manager = await db.seedBrandManager();
      const brand = await db.seedBrand();
      const payload = createValidPrescriptionDto({ brandId: brand.id });

      // When & Then: Prescriber role required
      const res = await client
        .asBrandManager(manager.id)
        .post('/api/prescriptions')
        .send(payload)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('POST /api/prescriptions - DTO Validation (400 Bad Request)', () => {
    it('should reject when brandId is not a valid UUID', async () => {
      // Given: Real Prescriber but invalid brandId format
      const { user } = await db.seedPrescriber();
      const invalidPayload = createValidPrescriptionDto({ brandId: 'invalid-non-uuid' });

      // When & Then
      const res = await client
        .asPrescriber(user.id)
        .post('/api/prescriptions')
        .send(invalidPayload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should reject when items list is empty', async () => {
      // Given: Empty items array
      const { user } = await db.seedPrescriber();
      const invalidPayload = createValidPrescriptionDto({ items: [] });

      // When & Then
      const res = await client
        .asPrescriber(user.id)
        .post('/api/prescriptions')
        .send(invalidPayload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should reject when an item quantity is zero or negative', async () => {
      // Given: Invalid item quantity
      const { user } = await db.seedPrescriber();
      const invalidPayload = createValidPrescriptionDto({
        items: [
          {
            variantId: 'gid://shopify/ProductVariant/111',
            title: 'Whey Isolate',
            quantity: 0,
            priceCents: 2990,
          },
        ],
      });

      // When & Then
      const res = await client
        .asPrescriber(user.id)
        .post('/api/prescriptions')
        .send(invalidPayload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/prescriptions - Domain Not Found (404 Not Found)', () => {
    it('should return 404 when prescriber user has no profile in real database', async () => {
      // Given: Real User exists as PRESCRIBER but has NO profile in database
      const userWithoutProfile = await db.seedPrescriberWithoutProfile();
      const brand = await db.seedBrand();
      const payload = createValidPrescriptionDto({ brandId: brand.id });

      // When & Then
      const res = await client
        .asPrescriber(userWithoutProfile.id)
        .post('/api/prescriptions')
        .send(payload)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toContain('Prescriber profile not found');
    });
  });
});
