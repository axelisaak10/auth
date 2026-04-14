import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export interface ApiResponse<T = any> {
  statusCode: number;
  intOpCode: string;
  data: T[];
}

const SERVICE_VALIDATION: Record<string, { prefix: string; serviceName: string }> = {
  '/auth/login': { prefix: 'microservicio-users', serviceName: 'users' },
  '/auth/register': { prefix: 'microservicio-users', serviceName: 'users' },
  '/auth/me': { prefix: 'microservicio-users', serviceName: 'users' },
  '/auth/profile': { prefix: 'microservicio-users', serviceName: 'users' },
  '/auth/permissions': { prefix: 'microservicio-users', serviceName: 'users' },
  '/users': { prefix: 'microservicio-users', serviceName: 'users' },
  '/groups': { prefix: 'microservicio-groups', serviceName: 'groups' },
  '/tickets': { prefix: 'microservicio-tickets', serviceName: 'tickets' },
};

const EXCLUDED_FROM_VALIDATION = [
  '/auth/permissions',
  '/auth/refresh',
  '/auth/revoke',
  '/auth/logout',
];

function validateResponseSchema(body: any, url: string): { valid: boolean; error?: string } {
  const isExcluded = EXCLUDED_FROM_VALIDATION.some((endpoint) => url.includes(endpoint));
  if (isExcluded) {
    return { valid: true };
  }

  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Response is not a valid JSON object' };
  }

  if (typeof body.statusCode !== 'number') {
    return { valid: false, error: 'Missing or invalid statusCode' };
  }

  if (typeof body.intOpCode !== 'string') {
    return { valid: false, error: 'Missing or invalid intOpCode' };
  }

  // Allow data to be an array OR an object (for POST/PATCH responses that return single objects)
  if (!body.data || (typeof body.data !== 'object')) {
    return { valid: false, error: 'Missing or invalid data (must be array or object)' };
  }

  const matchedService = Object.entries(SERVICE_VALIDATION).find(([path]) => url.includes(path));

  if (matchedService) {
    const expectedPattern = new RegExp(`^${matchedService[1].prefix}\\d{3}$`);
    if (!expectedPattern.test(body.intOpCode)) {
      return {
        valid: false,
        error: `Invalid intOpCode format. Expected: ${matchedService[1].prefix}xxx`,
      };
    }
  }

  return { valid: true };
}

function getErrorMessage(body: any): string {
  if (body?.data && Array.isArray(body.data) && body.data.length > 0) {
    const firstError = body.data[0];
    if (firstError?.message) {
      return firstError.message;
    }
    if (firstError?.error) {
      return firstError.error;
    }
  }
  if (body?.message) {
    return body.message;
  }
  return 'Error en el servidor';
}

@Injectable()
export class ValidationInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('[INTERCEPTOR] Request:', req.method, req.url);
    return next.handle(req).pipe(
      map((event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse) {
          console.log('[INTERCEPTOR] Response:', event.status, req.url);
          const validation = validateResponseSchema(event.body, req.url);

          if (!validation.valid) {
            console.error('[INTERCEPTOR] Invalid response schema:', validation.error, req.url);
            throw new Error('Respuesta inválida del servidor');
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[INTERCEPTOR] Error:', {
          status: error.status,
          url: req.url,
          message: error.message,
          error: error.error,
        });

        let errorMessage = 'Error de conexión';

        // Rate Limiting (429)
        if (error.status === 429) {
          const retryAfter = error.error?.data?.[0]?.retryAfter || '1 minuto';
          errorMessage = `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter}.`;
          return throwError(() => new Error(errorMessage));
        }

        if (error.error instanceof Blob) {
          return from(error.error.text()).pipe(
            switchMap((text: string) => {
              try {
                const body = JSON.parse(text);
                console.log('[INTERCEPTOR] Error body (Blob):', body);
                errorMessage = getErrorMessage(body);
              } catch {
                errorMessage = 'Error en el servidor';
              }
              return throwError(() => new Error(errorMessage));
            }),
          );
        }

        if (error.error && typeof error.error === 'object') {
          console.log('[INTERCEPTOR] Error body (object):', error.error);
          errorMessage = getErrorMessage(error.error);
        } else if (error.message) {
          errorMessage = error.message;
        }

        if (error.message) {
          errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
