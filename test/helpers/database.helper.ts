import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole, PrescriberStatus, User, Brand, PrescriberProfile } from '@prisma/client';

export interface SeedPrescriberResult {
  user: User;
  profile: PrescriberProfile;
}

export class DatabaseTestHelper {
  constructor(private readonly prisma: PrismaService) {}

  async cleanDatabase(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "order_attributions", 
        "prescriptions", 
        "promo_codes", 
        "prescriber_profiles", 
        "brands", 
        "users" 
      CASCADE;
    `);
  }

  /**
   * Seeds an authenticated Prescriber user with an approved profile in real PostgreSQL.
   */
  async seedPrescriber(email = 'coach.karim@nutrifit.com'): Promise<SeedPrescriberResult> {
    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.PRESCRIBER,
        prescriberProfile: {
          create: {
            fullName: 'Karim Bennani',
            specialty: 'Nutrition & CrossFit',
            status: PrescriberStatus.APPROVED,
          },
        },
      },
      include: {
        prescriberProfile: true,
      },
    });

    return {
      user,
      profile: user.prescriberProfile!,
    };
  }

  /**
   * Seeds an authenticated Prescriber user WITHOUT any profile in database (for 404 test).
   */
  async seedPrescriberWithoutProfile(email = 'profileless@nutrifit.com'): Promise<User> {
    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.PRESCRIBER,
      },
    });
  }

  /**
   * Seeds a Brand Manager and their Brand in real PostgreSQL.
   */
  async seedBrand(slug = 'gymshark-nutrition'): Promise<Brand> {
    const passwordHash = await bcrypt.hash('BrandPassword123!', 10);

    const user = await this.prisma.user.create({
      data: {
        email: `${slug}@brand.com`,
        passwordHash,
        role: UserRole.BRAND_MANAGER,
        brand: {
          create: {
            name: 'GymShark Nutrition',
            slug,
            shopifyDomain: `${slug}.myshopify.com`,
            defaultCommissionRate: 15.0,
          },
        },
      },
      include: {
        brand: true,
      },
    });

    return user.brand!;
  }

  /**
   * Seeds an Admin user in real PostgreSQL.
   */
  async seedAdmin(email = 'admin@nutrifit.com'): Promise<User> {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
  }

  /**
   * Seeds a Brand Manager user in real PostgreSQL.
   */
  async seedBrandManager(email = 'manager@brand.com'): Promise<User> {
    const passwordHash = await bcrypt.hash('ManagerPassword123!', 10);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.BRAND_MANAGER,
      },
    });
  }
}
