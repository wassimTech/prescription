import { PrescriberStatus, UserRole } from '@prisma/client';
import { CreatePrescriptionDto } from '@/modules/prescriptions/dto/create-prescription.dto';

/**
 * Standardized constants and test fixtures for E2E integration tests.
 * Eliminates magic strings and guarantees DRY across test suites.
 */
export const E2E_IDS = {
  PRESCRIBER_USER: '11111111-1111-4111-a111-111111111111',
  ADMIN_USER: '22222222-2222-4222-a222-222222222222',
  BRAND_MANAGER_USER: '33333333-3333-4333-a333-333333333333',
  PROFILELESS_PRESCRIBER: '44444444-4444-4444-a444-444444444444',
  PRESCRIBER_PROFILE: '55555555-5555-4555-a555-555555555555',
  BRAND: '423e4567-e89b-12d3-a456-426614174000',
  PROMO_CODE: '123e4567-e89b-12d3-a456-426614174001',
  PRESCRIPTION: '123e4567-e89b-12d3-a456-426614174099',
} as const;

export const E2E_USERS = {
  prescriber: {
    id: E2E_IDS.PRESCRIBER_USER,
    email: 'coach.karim@nutrifit.com',
    role: UserRole.PRESCRIBER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  admin: {
    id: E2E_IDS.ADMIN_USER,
    email: 'admin@nutrifit.com',
    role: UserRole.ADMIN,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  brandManager: {
    id: E2E_IDS.BRAND_MANAGER_USER,
    email: 'brand@nutrifit.com',
    role: UserRole.BRAND_MANAGER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  profilelessPrescriber: {
    id: E2E_IDS.PROFILELESS_PRESCRIBER,
    email: 'no.profile@nutrifit.com',
    role: UserRole.PRESCRIBER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
};

export const E2E_PROFILES = {
  prescriber: {
    id: E2E_IDS.PRESCRIBER_PROFILE,
    userId: E2E_IDS.PRESCRIBER_USER,
    status: PrescriberStatus.APPROVED,
  },
};

export function createValidPrescriptionDto(
  overrides?: Partial<CreatePrescriptionDto>,
): CreatePrescriptionDto {
  return {
    brandId: E2E_IDS.BRAND,
    items: [
      {
        variantId: 'gid://shopify/ProductVariant/111',
        title: 'Whey Isolate Chocolate 1kg',
        quantity: 2,
        priceCents: 2990,
      },
    ],
    notes: 'Prendre 1 scoop le matin',
    ...overrides,
  };
}
