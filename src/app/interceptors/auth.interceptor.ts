import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private isRefreshing = false;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
      return next.handle(req);
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
            switchMap(() => {
              this.isRefreshing = false;
              const newToken = this.authService.getToken();

              if (!newToken) {
                this.authService.logout();
                return throwError(() => new Error('No se pudo obtener nuevo token'));
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
              this.authService.logout();
              return throwError(() => refreshError);
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
