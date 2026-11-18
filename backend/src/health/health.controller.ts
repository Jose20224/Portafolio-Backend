import {
  Controller,
  Get,
  Header,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('health')
@Header('Cache-Control', 'no-store')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly supabase: SupabaseService) {}

  /** Liveness probe: confirms that the Node process and HTTP server respond. */
  @Get('live')
  getLiveness() {
    return {
      status: 'ok',
      service: 'portafolio-api',
      checkedAt: new Date().toISOString(),
    };
  }

  /** Readiness probe: confirms that the API can query the Supabase database. */
  @Get('ready')
  async getReadiness() {
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

  /** Backward-compatible route used by existing health checks. */
  @Get()
  getHealth() {
    return this.getReadiness();
  }
}
