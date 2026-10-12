/*
  Warnings:

  - You are about to alter the column `default_commission_rate` on the `brands` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to drop the column `promo_code` on the `prescriber_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `promo_code` on the `prescriptions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- DropIndex
DROP INDEX "prescriber_profiles_promo_code_key";

-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "default_commission_rate" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "order_attributions" ADD COLUMN     "promo_code_id" TEXT;

-- AlterTable
ALTER TABLE "prescriber_profiles" DROP COLUMN "promo_code";

-- AlterTable
ALTER TABLE "prescriptions" DROP COLUMN "promo_code",
ADD COLUMN     "promo_code_id" TEXT,
ALTER COLUMN "token" SET DEFAULT ('presc_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "prescriber_id" TEXT NOT NULL,
    "shopify_discount_id" TEXT,
    "discount_type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discount_value" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "usage_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_prescriber_id_idx" ON "promo_codes"("prescriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_brand_id_code_key" ON "promo_codes"("brand_id", "code");

-- CreateIndex
CREATE INDEX "order_attributions_promo_code_id_idx" ON "order_attributions"("promo_code_id");

-- CreateIndex
CREATE INDEX "prescriptions_promo_code_id_idx" ON "prescriptions"("promo_code_id");

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_prescriber_id_fkey" FOREIGN KEY ("prescriber_id") REFERENCES "prescriber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
