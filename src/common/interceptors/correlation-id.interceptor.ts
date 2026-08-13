import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const requestId = req.headers['x-request-id'] || uuidv4();
    const startedAt = Date.now();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        this.logger.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms [${requestId}] user=${req.user?.id || 'anon'}`);
      }),
    );
  }
}
