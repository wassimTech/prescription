import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(`[${method}] ${originalUrl} ${res.statusCode} +${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - now;
          const status = error.status || 500;
          this.logger.warn(
            `[${method}] ${originalUrl} ${status} +${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
