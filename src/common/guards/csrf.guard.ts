import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    if (!MUTATING_METHODS.has(request.method)) return true;

    // CSRF applies only to browser cookie-only authenticated requests without Bearer tokens or verified Origin.
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return true;
    }

    // Requests from browser with Origin header validated by CORS are immune to CSRF
    const origin = request.headers['origin'];
    if (origin) {
      return true;
    }

    if (!request.cookies?.access_token) return true;

    const cookieToken = request.cookies?.csrf_token;
    const headerToken = request.headers['x-csrf-token'];
    if (cookieToken && headerToken && cookieToken === headerToken) {
      return true;
    }

    if (!cookieToken) return true;

    throw new ForbiddenException('Invalid CSRF token');
  }
}
