import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiProperty({
    description: 'Shopify Variant ID or product identifier',
    example: 'gid://shopify/ProductVariant/44123456789',
  })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({
    description: 'Product title / name',
    example: 'Whey Isolate Chocolate 1kg',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Quantity prescribed (must be at least 1)',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Unit price in integer cents (e.g. 2990 = 29.90€)',
    example: 2990,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  priceCents!: number;
}

export class CreatePrescriptionDto {
  @ApiProperty({
    description: 'Target Brand UUID',
    example: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID()
  @IsNotEmpty()
  brandId!: string;

  @ApiProperty({
    description: 'Optional PromoCode UUID to auto-apply at Shopify checkout',
    example: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  promoCodeId?: string;

  @ApiProperty({
    description: 'List of prescribed products (at least 1 item required)',
    type: [PrescriptionItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items!: PrescriptionItemDto[];

  @ApiProperty({
    description: 'Optional recommendations or dosage notes for the client',
    example: 'Prendre 1 scoop le matin et 1 après l’entraînement',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
