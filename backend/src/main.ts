import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ApiRateLimitMiddleware } from './common/middleware/api-rate-limit.middleware.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1');

  // Trust only the number of reverse-proxy hops configured by the operator.
  // Keep 0 for direct access; Render uses one ingress proxy by default.
  const trustProxyHops = config.getOrThrow<number>('TRUST_PROXY_HOPS');
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', trustProxyHops);
  expressApp.disable('x-powered-by');

  app.use(helmet());

  const allowedOrigins = new Set(
    config
      .getOrThrow<string>('FRONTEND_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (
        error: Error | null,
        allow?: boolean | string | RegExp | (boolean | string | RegExp)[],
      ) => void,
    ): void => {
      // Requests without Origin include health checks and server-to-server calls.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type', 'Authorization'],
    maxAge: 600,
  });

  // Apply the limiter after CORS so browsers can read 429 responses from an
  // allowed frontend origin. This store is process-local; use shared Redis or
  // an edge limiter before running more than one API replica.
  const rateLimiter = new ApiRateLimitMiddleware();
  app.use(rateLimiter.use.bind(rateLimiter));

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
  logger.log(`Portafolio API listening on port ${port} with prefix /api/v1`);
}

void bootstrap();
