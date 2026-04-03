import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private isRefreshing = false;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
      return next.handle(req);
    }

    if (req.url.includes('/auth/logout') || req.url.includes('/auth/permissions')) {
      return next.handle(req.clone({ withCredentials: true }));
    }

    const token = this.authService.getToken();

    if (!token) {
      return next.handle(req.clone({ withCredentials: true }));
    }

    let authReq = req.clone({
      withCredentials: true,
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isRefreshing) {
          this.isRefreshing = true;

          return this.authService.refreshToken().pipe(
            tap({
              next: () => {
                this.isRefreshing = false;
              },
              error: () => {
                this.isRefreshing = false;
              },
            }),
            switchMap(() => {
              const newToken = this.authService.getToken();

              if (!newToken) {
                return throwError(() => new Error('No hay token disponible'));
              }

              const retryReq = req.clone({
                withCredentials: true,
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next.handle(retryReq);
            }),
            catchError((refreshError) => {
              this.isRefreshing = false;
              return throwError(() => refreshError);
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
