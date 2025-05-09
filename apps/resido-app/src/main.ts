import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

import { ResidoAppModule } from './resido-app.module';
import { LoggerService } from '@app/shared';
import { migrateTenants } from './scripts/migrate-tenants';

async function bootstrap(): Promise<void> {
  // Skapa en tillfällig ConfigService för loggern eftersom LoggerService kräver den
  const tempConfigService = new ConfigService();
  const bootstrapLogger = new LoggerService(tempConfigService);
  bootstrapLogger.setContext('Bootstrap');

  // Läs bekräftelse på om vi ska köra migrationerna
  const shouldRunMigrations = process.env.RUN_MIGRATIONS === 'true';

  if (shouldRunMigrations) {
    // Läs in migrations-variablerna från env
    const batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE || '5', 10);
    const lockTimeoutSeconds = parseInt(
      process.env.MIGRATION_LOCK_TIMEOUT || '300',
      10,
    );
    // MIGRATION_VERBOSE = 'true' betyder att vi vill ha full loggning => silent = false
    const silent = process.env.MIGRATION_VERBOSE === 'true' ? false : true;
    const specificTenantId = process.env.MIGRATION_TENANT_ID || undefined;

    bootstrapLogger.log(
      'Running tenant migrations before application start...',
      {
        batchSize,
        lockTimeoutSeconds,
        silent,
        specificTenantId,
      },
    );

    try {
      await migrateTenants({
        batchSize,
        lockTimeoutSeconds,
        silent,
        specificTenantId,
      });
      bootstrapLogger.log('Migrations completed successfully');
    } catch (error) {
      bootstrapLogger.error(
        'Migration process failed, but continuing with application startup.',
        error instanceof Error ? error.stack : 'Unknown error',
      );
    }
  }

  try {
    const host = process.env.RESIDO_APP_HOST || '0.0.0.0';
    const port = parseInt(process.env.RESIDO_APP_PORT || '5000', 10);

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      ResidoAppModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'resido',
          protoPath: join(
            __dirname,
            '../../../libs/shared/src/proto/resido.proto',
          ),
          url: `${host}:${port}`,
        },
      },
    );

    const logger = app.get(LoggerService);
    logger.setContext('Resido');

    await app.listen();
    logger.log(`gRPC Microservice (resido-app) is listening on port ${port}`, {
      host,
      port,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error(
      'Fatal error starting microservice:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

void bootstrap();
