import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly supabase: SupabaseService) {}

  /** API liveness + Supabase connectivity check. */
  @Get()
  async getHealth() {
    const checkedAt = new Date().toISOString();

    try {
      await this.supabase.checkDatabaseConnection();

      return {
        status: 'ok',
        service: 'portafolio-api',
        checkedAt,
        dependencies: {
          database: 'connected',
        },
      };
    } catch (error) {
      // Do not return internal database details or secrets to the caller.
      this.logger.error(
        'Supabase connectivity check failed.',
        error instanceof Error ? error.stack : undefined,
      );

      throw new ServiceUnavailableException({
        status: 'error',
        service: 'portafolio-api',
        checkedAt,
        dependencies: {
          database: 'unavailable',
        },
      });
    }
  }
}
