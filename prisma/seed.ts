import { PrismaClient, UserRole, PrescriberStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Linkers IT test database...');

  // 1. Clean existing records
  await prisma.orderAttribution.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.prescriberProfile.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Brand Manager User & Brand
  const brandUser = await prisma.user.create({
    data: {
      email: 'brand@nutrifit.com',
      passwordHash: '$2b$10$wKzGgQ...', // Mock bcrypt hash
      role: UserRole.BRAND_MANAGER,
      brand: {
        create: {
          name: 'NutriFit Pro',
          slug: 'nutrifit-pro',
          shopifyDomain: 'nutrifit-pro.myshopify.com',
          defaultCommissionRate: 15.0,
        },
      },
    },
    include: { brand: true },
  });

  // 3. Create Prescriber User & Profile
  const prescriberUser = await prisma.user.create({
    data: {
      email: 'coach.karim@gmail.com',
      passwordHash: '$2b$10$wKzGgQ...',
      role: UserRole.PRESCRIBER,
      prescriberProfile: {
        create: {
          fullName: 'Karim Ben Salem',
          specialty: 'Nutrition & CrossFit Coach',
          status: PrescriberStatus.APPROVED,
          promoCode: 'KARIM10',
          totalEarningsCents: 15000, // 150.00 EUR
          pendingPayoutCents: 5000,  // 50.00 EUR
        },
      },
    },
    include: { prescriberProfile: true },
  });

  // 4. Create Sample Prescription
  if (brandUser.brand && prescriberUser.prescriberProfile) {
    await prisma.prescription.create({
      data: {
        token: 'presc_karim_9941a',
        brandId: brandUser.brand.id,
        prescriberId: prescriberUser.prescriberProfile.id,
        promoCode: prescriberUser.prescriberProfile.promoCode,
        notes: 'Pack prise de masse sèche personnalisé',
        items: [
          { variantId: 'gid://shopify/ProductVariant/101', title: 'Whey Isolate Vanille 1kg', quantity: 2, priceCents: 4500 },
          { variantId: 'gid://shopify/ProductVariant/102', title: 'Créatine Monohydrate 300g', quantity: 1, priceCents: 2200 },
        ],
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
