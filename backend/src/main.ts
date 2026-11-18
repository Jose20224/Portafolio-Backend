import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1');

  // Only trust the number of reverse-proxy hops configured by the operator.
  // Keep 0 when the API is reached directly; set the exact trusted hop count
  // when deployed behind a known ingress/load balancer.
  const trustProxyHops = config.getOrThrow<number>('TRUST_PROXY_HOPS');
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);

  app.use(helmet());

  const allowedOrigins = new Set(
    config
      .getOrThrow<string>('FRONTEND_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Requests without an Origin header include health checks and server calls.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');
  logger.log(`Portafolio API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
