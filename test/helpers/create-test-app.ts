import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

export interface CustomOverride {
  provide: unknown;
  useValue: unknown;
}

export interface CreateTestAppOptions {
  mockPrisma?: unknown;
  overrides?: CustomOverride[];
}

export async function createTestApp(options: CreateTestAppOptions = {}): Promise<INestApplication> {
  let builder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (options.mockPrisma) {
    builder = builder.overrideProvider(PrismaService).useValue(options.mockPrisma);
  }

  if (options.overrides) {
    for (const override of options.overrides) {
      builder = builder.overrideProvider(override.provide).useValue(override.useValue);
    }
  }

  const moduleFixture = await builder.compile();
  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
}
