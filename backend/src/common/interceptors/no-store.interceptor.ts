import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Observable } from 'rxjs';

/** Applies no-store to every response handled by a controller. */
export class NoStoreInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const response = context
      .switchToHttp()
      .getResponse<Response>();

    response.setHeader('Cache-Control', 'no-store');
    return next.handle();
  }
}
