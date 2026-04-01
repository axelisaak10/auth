import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface UserSession {
  id: string;
  email: string;
  username?: string;
  nombre_completo?: string;
  nombreCompleto?: string;
  direccion?: string;
  telefono?: string;
  fecha_inicio?: string;
  fecha_nacimiento?: string;
  last_login?: string;
  permisos_globales?: string[];
  grupoId?: number;
}

export const API_GATEWAY = 'http://localhost:3008/api';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiBase = API_GATEWAY;
  private apiAuth = `${this.apiBase}/auth`;
  private apiRegister = `${this.apiAuth}/register`;
  private apiUsers = `${this.apiBase}/users`;
  private apiPermissions = `${this.apiBase}/permissions`;

  private _isLoggedIn = signal(this.checkStorage());

  isLoggedIn = computed(() => this._isLoggedIn());

  getToken(): string | null {
    return this.getTokenFromCookie();
  }

  private getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'Authentication') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private extractUserData(response: any): UserSession {
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    if (response && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.id && response.email) {
      return response;
    }
    return response;
  }

  private saveSession(userData: UserSession): void {
    const sessionData = {
      id: userData.id,
      email: userData.email || '',
      username: userData.username || '',
      nombre_completo: userData.nombre_completo || '',
      nombreCompleto: userData.nombreCompleto || userData.nombre_completo || '',
      direccion: userData.direccion || '',
      telefono: userData.telefono || '',
      fecha_inicio: userData.fecha_inicio || '',
      fecha_nacimiento: userData.fecha_nacimiento || '',
      last_login: userData.last_login || '',
      permisos_globales: userData.permisos_globales || [],
    };
    localStorage.setItem('session', JSON.stringify(sessionData));
    this._isLoggedIn.set(true);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(this.apiAuth + '/login', credentials, { withCredentials: true }).pipe(
      tap((response: any) => {
        const userData = this.extractUserData(response);
        this.saveSession(userData);
      }),
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(this.apiRegister, userData);
  }

  refreshToken(): Observable<any> {
    return this.http.post(this.apiAuth + '/refresh', {}, { withCredentials: true }).pipe(
      tap((response: any) => {
        const userData = this.extractUserData(response);
        const currentUser = this.getUser();
        const updatedUser = {
          ...currentUser,
          id: userData.id,
          nombre_completo: userData.nombre_completo || currentUser?.nombre_completo,
          permisos_globales: userData.permisos_globales || currentUser?.permisos_globales,
        };
        localStorage.setItem('session', JSON.stringify(updatedUser));
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => error);
      }),
    );
  }

  revokeToken(): Observable<any> {
    return this.http.post(this.apiAuth + '/revoke', {});
  }

  logout(): void {
    this.http.post(this.apiAuth + '/logout', {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(): void {
    localStorage.removeItem('session');
    this._isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  registerPublic(userData: any): Observable<any> {
    return this.http.post(this.apiRegister, userData);
  }

  createUserByAdmin(userData: any): Observable<any> {
    return this.http.post(this.apiUsers, userData);
  }

  getAllPermissions(): Observable<string[]> {
    return this.http.get<string[]>(this.apiPermissions);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.patch(this.apiAuth + '/profile', profileData).pipe(
      tap((response: any) => {
        const userData = this.extractUserData(response);
        if (userData) {
          const currentUser = this.getUser();
          const updatedUser = { ...currentUser, ...userData };
          localStorage.setItem('session', JSON.stringify(updatedUser));
        }
      }),
    );
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUsers);
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUsers}/${userId}`);
  }

  updateUserByAdmin(userId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUsers}/${userId}`, data);
  }

  getUser(): UserSession | null {
    const data = localStorage.getItem('session');
    return data ? JSON.parse(data) : null;
  }

  private checkStorage(): boolean {
    const data = localStorage.getItem('session');
    if (!data) return false;
    try {
      const parsed = JSON.parse(data);
      return !!(parsed.id && parsed.permisos_globales);
    } catch {
      return false;
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user || !user.permisos_globales) return false;
    return (
      user.permisos_globales.includes(permission) || user.permisos_globales.includes('superadmin')
    );
  }

  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.permisos_globales?.includes('superadmin') || false;
  }
}
