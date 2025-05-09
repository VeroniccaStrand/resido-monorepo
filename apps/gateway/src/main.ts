import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@app/shared/logger/logger.service';
import { GatewayModule } from './gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create(GatewayModule);

    const logger = app.get(LoggerService);
    logger.setContext('Gateway');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Resido API Gateway')
      .setDescription('API-dokumentation för Resido-plattformen')
      .setVersion('1.0')
      .addBearerAuth() // Lägger till auth-stöd i Swagger UI
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    app.enableCors();

    const port = process.env.GATEWAY_PORT || 3000;
    await app.listen(port);

    logger.log(`Gateway is running on port ${port}`);
  } catch (error: unknown) {
    const typedError = error as Error;
    console.error('Fatal error starting gateway:', typedError.message);
    if (typedError.stack) {
      console.error(typedError.stack);
    }
    process.exit(1);
  }
}

void bootstrap();
