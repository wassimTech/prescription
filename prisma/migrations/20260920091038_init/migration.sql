-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BRAND_MANAGER', 'PRESCRIBER');

-- CreateEnum
CREATE TYPE "PrescriberStatus" AS ENUM ('PENDING', 'VERIFYING_AI', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttributionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REFUNDED', 'PAID');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PRESCRIBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shopify_domain" TEXT NOT NULL,
    "shopify_access_token" TEXT,
    "default_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriber_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL DEFAULT 'Fitness Coach',
    "phone" TEXT,
    "status" "PrescriberStatus" NOT NULL DEFAULT 'PENDING',
    "promo_code" TEXT NOT NULL,
    "total_earnings_cents" INTEGER NOT NULL DEFAULT 0,
    "pending_payout_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriber_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "prescriber_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "promo_code" TEXT NOT NULL,
    "notes" TEXT,
    "clicks_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_attributions" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "prescriber_id" TEXT NOT NULL,
    "prescription_id" TEXT,
    "shopify_order_id" TEXT NOT NULL,
    "order_amount_cents" INTEGER NOT NULL,
    "commission_amount_cents" INTEGER NOT NULL,
    "status" "AttributionStatus" NOT NULL DEFAULT 'PENDING',
    "shopify_created_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brands_user_id_key" ON "brands"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_shopify_domain_key" ON "brands"("shopify_domain");

-- CreateIndex
CREATE UNIQUE INDEX "prescriber_profiles_user_id_key" ON "prescriber_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "prescriber_profiles_promo_code_key" ON "prescriber_profiles"("promo_code");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_token_key" ON "prescriptions"("token");

-- CreateIndex
CREATE INDEX "prescriptions_brand_id_idx" ON "prescriptions"("brand_id");

-- CreateIndex
CREATE INDEX "prescriptions_prescriber_id_idx" ON "prescriptions"("prescriber_id");

-- CreateIndex
CREATE INDEX "prescriptions_token_idx" ON "prescriptions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "order_attributions_shopify_order_id_key" ON "order_attributions"("shopify_order_id");

-- CreateIndex
CREATE INDEX "order_attributions_brand_id_status_idx" ON "order_attributions"("brand_id", "status");

-- CreateIndex
CREATE INDEX "order_attributions_prescriber_id_status_idx" ON "order_attributions"("prescriber_id", "status");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriber_profiles" ADD CONSTRAINT "prescriber_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescriber_id_fkey" FOREIGN KEY ("prescriber_id") REFERENCES "prescriber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_prescriber_id_fkey" FOREIGN KEY ("prescriber_id") REFERENCES "prescriber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_attributions" ADD CONSTRAINT "order_attributions_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
