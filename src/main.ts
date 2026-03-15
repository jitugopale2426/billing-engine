import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validation
  // Return meaningful structured error responses
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       
      forbidNonWhitelisted: true,
      transform: true,    
    }),
  );

  // Swagger Setup
  // must be accessible at /api/docs
  const config = new DocumentBuilder()
    .setTitle('Billing Engine API')
    .setDescription('SaaS Subscription & Billing Engine — The Fast Way Assignment')
    .setVersion('1.0')
    .addTag('plans')
    .addTag('customers')
    .addTag('subscriptions')
    .addTag('invoices')
    .addTag('usage')
    .addTag('stats')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`App running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();