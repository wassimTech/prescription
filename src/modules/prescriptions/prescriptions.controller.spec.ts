import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { UserProfileDto } from '@/modules/auth/dto/auth-response.dto';

describe('PrescriptionsController', () => {
  let controller: PrescriptionsController;
  let prescriptionsService: PrescriptionsService;

  const mockPrescriptionResponse: PrescriptionResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    token: 'presc_7f3a9b1c4e',
    items: [
      {
        variantId: 'gid://shopify/ProductVariant/111',
        title: 'Whey Isolate Chocolate 1kg',
        quantity: 2,
        priceCents: 2990,
      },
    ],
    notes: 'Prendre 1 scoop le matin et 1 après l’entraînement',
    promoCodeId: '123e4567-e89b-12d3-a456-426614174001',
    brand: {
      id: '423e4567-e89b-12d3-a456-426614174000',
      name: 'GymShark Nutrition',
      shopifyDomain: 'gymshark-nutrition.myshopify.com',
    },
    createdAt: new Date('2026-10-10T14:30:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrescriptionsController],
      providers: [
        {
          provide: PrescriptionsService,
          useValue: {
            create: vi.fn().mockResolvedValue(mockPrescriptionResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<PrescriptionsController>(PrescriptionsController);
    prescriptionsService = module.get<PrescriptionsService>(PrescriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new prescription', async () => {
    const user: UserProfileDto = {
      id: 'user-id-1',
      email: 'coach.karim@gmail.com',
      role: UserRole.PRESCRIBER,
      createdAt: new Date('2026-09-20T12:00:00.000Z'),
    };

    const dto: CreatePrescriptionDto = {
      brandId: '423e4567-e89b-12d3-a456-426614174000',
      promoCodeId: '123e4567-e89b-12d3-a456-426614174001',
      items: [
        {
          variantId: 'gid://shopify/ProductVariant/111',
          title: 'Whey Isolate Chocolate 1kg',
          quantity: 2,
          priceCents: 2990,
        },
      ],
      notes: 'Prendre 1 scoop le matin et 1 après l’entraînement',
    };

    const result = await controller.create(dto, user);

    expect(result).toEqual(mockPrescriptionResponse);
    expect(prescriptionsService.create).toHaveBeenCalledWith(dto, user.id);
  });
});
