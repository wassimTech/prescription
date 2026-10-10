import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PrescriberStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let mockPrisma: {
    prescription: {
      create: ReturnType<typeof vi.fn>;
    };
    prescriberProfile: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      prescription: {
        create: vi.fn(),
      },
      prescriberProfile: {
        findUnique: vi.fn(),
      },
    };

    service = new PrescriptionsService(mockPrisma as unknown as PrismaService);
  });

  describe('create', () => {
    const mockedDbResponse = {
      id: 'pres-uuid-1',
      token: 'presc_7f3a9b1c4e',
      notes: 'Prendre 1 scoop le matin',
      promoCodeId: 'promo-code-123',
      brand: {
        id: 'brand-123',
        name: 'GymShark Nutrition',
        shopifyDomain: 'gymshark-nutrition.myshopify.com',
      },
      createdAt: new Date('2026-10-10T14:30:00.000Z'),
    };

    const validDto: CreatePrescriptionDto = {
      brandId: 'brand-123',
      promoCodeId: 'promo-code-123',
      items: [
        {
          variantId: 'variant-123',
          title: 'Whey Isolate',
          quantity: 2,
          priceCents: 2990,
        },
      ],
      notes: 'Prendre 1 scoop le matin',
    };

    it('should create a new prescription and return formatted response', async () => {
      mockPrisma.prescriberProfile.findUnique.mockResolvedValueOnce({
        id: 'prescriber-profile-id-1',
        status: PrescriberStatus.APPROVED,
      });

      mockPrisma.prescription.create.mockResolvedValueOnce(mockedDbResponse);

      const result: PrescriptionResponseDto = await service.create(validDto, 'user-1');

      expect(mockPrisma.prescriberProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true, status: true },
      });

      expect(mockPrisma.prescription.create).toHaveBeenCalledWith({
        data: {
          brandId: validDto.brandId,
          prescriberId: 'prescriber-profile-id-1',
          promoCodeId: validDto.promoCodeId,
          items: validDto.items,
          notes: validDto.notes,
        },
        select: {
          id: true,
          token: true,
          notes: true,
          createdAt: true,
          promoCodeId: true,
          brand: {
            select: {
              id: true,
              name: true,
              shopifyDomain: true,
            },
          },
        },
      });

      expect(result).toEqual({
        ...mockedDbResponse,
        items: validDto.items,
      });
    });

    it('should create prescription without optional promoCodeId and notes', async () => {
      const minimalDto: CreatePrescriptionDto = {
        brandId: 'brand-123',
        items: [
          {
            variantId: 'variant-123',
            title: 'Creatine Monohydrate',
            quantity: 1,
            priceCents: 1990,
          },
        ],
      };

      const minimalDbResponse = {
        id: 'pres-uuid-2',
        token: 'presc_8a1b2c3d4e',
        notes: null,
        promoCodeId: null,
        brand: {
          id: 'brand-123',
          name: 'GymShark Nutrition',
          shopifyDomain: 'gymshark-nutrition.myshopify.com',
        },
        createdAt: new Date('2026-10-10T14:35:00.000Z'),
      };

      mockPrisma.prescriberProfile.findUnique.mockResolvedValueOnce({
        id: 'prescriber-profile-id-1',
        status: PrescriberStatus.APPROVED,
      });
      mockPrisma.prescription.create.mockResolvedValueOnce(minimalDbResponse);

      const result = await service.create(minimalDto, 'user-1');

      expect(result.promoCodeId).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.items).toEqual(minimalDto.items);
    });

    it('should throw NotFoundException if prescriber profile does not exist', async () => {
      mockPrisma.prescriberProfile.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(validDto, 'non-existent-user-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.prescription.create).not.toHaveBeenCalled();
    });
  });
});
