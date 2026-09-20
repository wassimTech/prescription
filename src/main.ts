import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
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

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Linkers IT - Prescription-to-eCommerce SaaS API')
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
    .addTag('Health', 'Health checks and database readiness')
    .addTag('Prescriptions', 'Curated carts & tracked link engine')
    .addTag('Shopify', 'Storefront, Admin GraphQL, and Webhook ingestion')
    .addTag('Attribution', 'Order tracking and double-entry commission ledger')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Linkers IT SaaS API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Linkers IT Prescription SaaS API running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger UI documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check available at: http://localhost:${port}/api/health`);
}

bootstrap();
