import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { E2E_USERS } from '../fixtures/e2e-constants';

export interface TokenPayloadOptions {
  sub?: string;
  email?: string;
  role?: UserRole;
  expiresIn?: string;
}

export class AuthTestHelper {
  private readonly jwtService: JwtService;

  constructor(private readonly app: INestApplication) {
    this.jwtService = this.app.get(JwtService);
  }

  generateToken(options: TokenPayloadOptions = {}): string {
    const payload = {
      sub: options.sub ?? E2E_USERS.prescriber.id,
      email: options.email ?? E2E_USERS.prescriber.email,
      role: options.role ?? UserRole.PRESCRIBER,
    };

    return this.jwtService.sign(payload, {
      expiresIn: options.expiresIn ?? '1h',
    });
  }

  asPrescriber(userId?: string): string {
    return this.generateToken({
      sub: userId ?? E2E_USERS.prescriber.id,
      email: E2E_USERS.prescriber.email,
      role: UserRole.PRESCRIBER,
    });
  }

  asAdmin(userId?: string): string {
    return this.generateToken({
      sub: userId ?? E2E_USERS.admin.id,
      email: E2E_USERS.admin.email,
      role: UserRole.ADMIN,
    });
  }

  asBrandManager(userId?: string): string {
    return this.generateToken({
      sub: userId ?? E2E_USERS.brandManager.id,
      email: E2E_USERS.brandManager.email,
      role: UserRole.BRAND_MANAGER,
    });
  }

  invalidToken(): string {
    return 'invalid.jwt.token.format';
  }

  expiredToken(): string {
    return this.generateToken({ expiresIn: '-10s' });
  }
}
