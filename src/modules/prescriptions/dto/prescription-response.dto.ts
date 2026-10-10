import { ApiProperty } from '@nestjs/swagger';
import { PrescriptionItemDto } from './create-prescription.dto';

export class PrescriptionBrandDto {
  @ApiProperty({
    description: 'Brand unique UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Brand public name',
    example: 'GymShark Nutrition',
  })
  name!: string;

  @ApiProperty({
    description: 'Shopify myshopify.com store domain',
    example: 'gymshark-nutrition.myshopify.com',
  })
  shopifyDomain!: string;
}

export class PrescriptionResponseDto {
  @ApiProperty({
    description: 'Prescription unique UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Unique tracking token slug for checkout deep link',
    example: 'presc_7f3a9b1c4e',
  })
  token!: string;

  @ApiProperty({
    description: 'List of prescribed products and quantities',
    type: [PrescriptionItemDto],
  })
  items!: PrescriptionItemDto[];

  @ApiProperty({
    description: 'Prescriber instructions or notes for client',
    example: 'Prendre 1 scoop le matin et 1 après l’entraînement',
    nullable: true,
    required: false,
  })
  notes?: string | null;

  @ApiProperty({
    description: 'Associated promo code UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
    required: false,
  })
  promoCodeId?: string | null;

  @ApiProperty({
    description: 'Brand summary linked to the prescription',
    type: PrescriptionBrandDto,
  })
  brand!: PrescriptionBrandDto;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-10-10T14:30:00.000Z',
  })
  createdAt!: Date;
}
