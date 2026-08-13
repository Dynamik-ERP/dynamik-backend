import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../modules/audit/audit.service.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    if (!MUTATING_METHODS.has(req.method)) return next.handle();

    return next.handle().pipe(
      tap((responseBody: any) => {
        const entityType = this.extractEntityType(req.path || req.url || 'unknown');
        const entityId = responseBody?.id || req.params?.id;
        if (!entityId || !this.looksLikeUuid(entityId)) return;

        this.auditService
          .log({
            entityType,
            entityId,
            action: `${req.method} ${req.path || req.url}`,
            actorId: req.user?.id,
            changes: req.body,
            metadata: {
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              requestId: req.requestId,
            },
          })
          .catch(() => undefined);
      }),
    );
  }

  private extractEntityType(path: string) {
    const cleanPath = path.replace(/^\/api\/v\d+\//, '').replace(/^\//, '');
    return cleanPath.split('/')[0] || 'unknown';
  }

  private looksLikeUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
