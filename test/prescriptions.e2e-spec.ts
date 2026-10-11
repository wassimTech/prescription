import { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { PrescriberStatus, UserRole } from '@prisma/client';
import { createTestApp } from './helpers/create-test-app';
import { CreatePrescriptionDto } from '@/modules/prescriptions/dto/create-prescription.dto';

describe('PrescriptionsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prescriberToken: string;

  const prescriberUserId = 'prescriber-user-uuid-1';
  const brandUuid = '423e4567-e89b-12d3-a456-426614174000';
  const promoCodeUuid = '123e4567-e89b-12d3-a456-426614174001';

  const mockPrescriberProfile = {
    id: 'prescriber-profile-id-1',
    status: PrescriberStatus.APPROVED,
  };

  const mockedDbResponse = {
    id: '123e4567-e89b-12d3-a456-426614174099',
    token: 'presc_7f3a9b1c4e',
    notes: 'Prendre 1 scoop le matin',
    promoCodeId: promoCodeUuid,
    brand: {
      id: brandUuid,
      name: 'GymShark Nutrition',
      shopifyDomain: 'gymshark-nutrition.myshopify.com',
    },
    createdAt: new Date('2026-10-10T14:30:00.000Z'),
  };

  const validDto: CreatePrescriptionDto = {
    brandId: brandUuid,
    promoCodeId: promoCodeUuid,
    items: [
      {
        variantId: 'gid://shopify/ProductVariant/111',
        title: 'Whey Isolate',
        quantity: 2,
        priceCents: 2990,
      },
    ],
    notes: 'Prendre 1 scoop le matin',
  };

  const mockPrismaService = {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === prescriberUserId) {
          return Promise.resolve({
            id: prescriberUserId,
            email: 'coach.karim@nutrifit.com',
            role: UserRole.PRESCRIBER,
            createdAt: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
    },
    prescriberProfile: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.userId === prescriberUserId) {
          return Promise.resolve(mockPrescriberProfile);
        }
        return Promise.resolve(null);
      }),
    },
    prescription: {
      create: vi.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          ...mockedDbResponse,
          notes: data.notes,
          promoCodeId: data.promoCodeId,
          createdAt: new Date(),
        });
      }),
    },
  };

  beforeAll(async () => {
    app = await createTestApp({ mockPrisma: mockPrismaService });
    jwtService = app.get(JwtService);

    prescriberToken = jwtService.sign({
      sub: prescriberUserId,
      email: 'coach.karim@nutrifit.com',
      role: UserRole.PRESCRIBER,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/prescriptions should create a prescription with valid bearer token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${prescriberToken}`)
      .send(validDto)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.items).toEqual(validDto.items);
    expect(res.body.data.notes).toBe(validDto.notes);
    expect(res.body.data.brand).toBeDefined();
  });
});
