import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Enable graceful shutdown hooks (for Prisma and background tasks)
  app.enableShutdownHooks();

  // 2. Global prefix
  app.setGlobalPrefix('api');

  // 3. Strict CORS configuration (no reflected wildcard with credentials)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 4. Global validation pipe
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

  // 5. Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Prescription-to-eCommerce SaaS API')
    .setDescription(
      'API RESTful powering Brand dashboards, Prescriber portal, Shopify integration, Attribution and Commission engine.',
    )
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication and role-based access control (JWT & RBAC)')
    .addTag('Health', 'Health checks and database readiness')
    .addTag('Prescriptions', 'Curated carts & tracked link engine')
    .addTag('Shopify', 'Storefront, Admin GraphQL, and Webhook ingestion')
    .addTag('Attribution', 'Order tracking and double-entry commission ledger')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Prescription SaaS API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Prescription SaaS API running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger UI documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check available at: http://localhost:${port}/api/health`);
}

bootstrap();
