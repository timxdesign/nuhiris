import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest<{ method: string; url: string }>();
    const method = req.method;
    const path = req.url.split('?')[0] ?? '/';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const res = context.switchToHttp().getResponse<{ statusCode: number }>();
          const status = String(res.statusCode);

          this.metricsService.incrementCounter('http_requests_total', { method, path, status });
          this.metricsService.observeHistogram('http_request_duration_seconds', duration, { method, path });
        },
        error: () => {
          const duration = (Date.now() - start) / 1000;
          this.metricsService.incrementCounter('http_requests_total', { method, path, status: '500' });
          this.metricsService.observeHistogram('http_request_duration_seconds', duration, { method, path });
        },
      }),
    );
  }
}
