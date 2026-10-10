import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePrescriptionDto, userId: string): Promise<PrescriptionResponseDto> {
    const prescriber = await this.prisma.prescriberProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!prescriber) {
      throw new NotFoundException('Prescriber profile not found for this user');
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        brandId: dto.brandId,
        prescriberId: prescriber.id,
        promoCodeId: dto.promoCodeId,
        items: dto.items as unknown as Prisma.InputJsonValue,
        notes: dto.notes,
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

    return {
      ...prescription,
      items: dto.items,
    };
  }
}
