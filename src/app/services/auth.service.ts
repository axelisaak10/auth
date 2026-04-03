import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, tap, catchError, throwError, lastValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { map } from 'rxjs/operators';

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

const STORAGE_KEY = '_user_recovery';

const SYNC_CONFIG = {
  SYNC_INTERVAL: 60000,
  INACTIVITY_THRESHOLD: 300000,
  MAX_FAILURES: 3,
};

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

  private _user = signal<UserSession | null>(null);
  private _isLoggedIn = signal(this.checkRecovery());

  private permissionSyncInterval: any = null;
  private lastActivity: number = Date.now();
  private lastSyncTimestamp: number = 0;
  private isSyncing: boolean = false;
  private consecutiveFailures: number = 0;
  private pendingSync: boolean = false;
  private cachedPermissions: string[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initializeFromRecovery();
  }

  private initializeFromRecovery(): void {
    if (this.isInitialized) return;

    const recovery = this.getRecoveryData();
    if (recovery && recovery.id) {
      this._user.set(recovery);
      this.cachedPermissions = [...(recovery.permisos_globales || [])];
      this._isLoggedIn.set(true);
    }
    this.isInitialized = true;
  }

  user = computed(() => this._user());
  isLoggedIn = computed(() => this._isLoggedIn());
  userPermissions = computed(() => this._user()?.permisos_globales || []);

  private isUserActive(): boolean {
    return Date.now() - this.lastActivity < SYNC_CONFIG.INACTIVITY_THRESHOLD;
  }

  private shouldSyncPermissions(): boolean {
    const user = this._user();
    if (!user || !user.id) return false;
    if (this.isSyncing) return false;
    if (this.consecutiveFailures >= SYNC_CONFIG.MAX_FAILURES) return false;
    if (Date.now() - this.lastSyncTimestamp < SYNC_CONFIG.SYNC_INTERVAL) return false;
    if (!this.isUserActive()) {
      this.pendingSync = true;
      return false;
    }
    return true;
  }

  private permissionsHaveChanged(newPermissions: string[]): boolean {
    if (!this.cachedPermissions.length && newPermissions.length) return true;
    if (this.cachedPermissions.length !== newPermissions.length) return true;
    const sortedCache = [...this.cachedPermissions].sort();
    const sortedNew = [...newPermissions].sort();
    return !sortedCache.every((p, i) => p === sortedNew[i]);
  }

  private updateUserPermissions(permissions: string[]): void {
    const current = this._user() || this.getRecoveryData() || { id: '', email: '' };
    const updated: UserSession = {
      ...current,
      permisos_globales: permissions,
    };
    this._user.set(updated);
    this.saveToRecovery(updated);
    this.cachedPermissions = [...permissions];
  }

  private async fetchPermissionsFromServer(): Promise<string[]> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    const response: any = await lastValueFrom(
      this.http.get<any>(`${this.apiAuth}/permissions`, options),
    );
    return response?.permisos_globales || [];
  }

  private handleActivity(): void {
    this.lastActivity = Date.now();
    if (this.pendingSync && this.shouldSyncPermissions()) {
      this.pendingSync = false;
      this.executePermissionSync();
    }
  }

  private startPermissionSync(): void {
    this.stopPermissionSync();
    this.permissionSyncInterval = setInterval(() => {
      this.executePermissionSync();
    }, SYNC_CONFIG.SYNC_INTERVAL);
  }

  private stopPermissionSync(): void {
    if (this.permissionSyncInterval) {
      clearInterval(this.permissionSyncInterval);
      this.permissionSyncInterval = null;
    }
  }

  private async executePermissionSync(): Promise<void> {
    if (!this.shouldSyncPermissions()) return;

    this.isSyncing = true;

    try {
      const newPermissions = await this.fetchPermissionsFromServer();

      if (this.permissionsHaveChanged(newPermissions)) {
        this.updateUserPermissions(newPermissions);
      }

      this.lastSyncTimestamp = Date.now();
      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;
    } finally {
      this.isSyncing = false;
    }
  }

  private activityHandler: EventListener = () => this.handleActivity();

  private initActivityMonitor(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, this.activityHandler, { passive: true });
    });
  }

  private removeActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.removeEventListener(event, this.activityHandler);
    });
  }

  initRouterSync(router: Router): void {
    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        const user = this._user();
        if (user && user.id) {
          this.executePermissionSyncImmediate();
        }
      });
  }

  private async executePermissionSyncImmediate(): Promise<void> {
    if (this.isSyncing) return;
    if (this.consecutiveFailures >= SYNC_CONFIG.MAX_FAILURES) return;

    const token = this.getToken();
    if (!token) return;

    this.isSyncing = true;

    try {
      const newPermissions = await this.fetchPermissionsFromServer();

      if (this.permissionsHaveChanged(newPermissions)) {
        this.updateUserPermissions(newPermissions);
      }

      this.lastSyncTimestamp = Date.now();
      this.consecutiveFailures = 0;
    } catch {
      this.consecutiveFailures++;
    } finally {
      this.isSyncing = false;
    }
  }

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
    const sessionData: UserSession = {
      id: userData.id || '',
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

    this._user.set(sessionData);
    this._isLoggedIn.set(true);

    this.saveToRecovery(sessionData);
  }

  private saveToRecovery(data: UserSession): void {
    try {
      const recoveryData = {
        id: data.id,
        email: data.email,
        permisos_globales: data.permisos_globales,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recoveryData));
    } catch (e) {
      console.warn('Could not save recovery data', e);
    }
  }

  private getRecoveryData(): UserSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      const maxAge = 1000 * 60 * 30;
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return {
        id: parsed.id || '',
        email: parsed.email || '',
        permisos_globales: parsed.permisos_globales || [],
      };
    } catch {
      return null;
    }
  }

  private checkRecovery(): boolean {
    const recovery = this.getRecoveryData();
    return !!(recovery?.id && recovery?.permisos_globales?.length);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(this.apiAuth + '/login', credentials, { withCredentials: true }).pipe(
      tap((response: any) => {
        const userData = this.extractUserData(response);
        this.saveSession(userData);
        this.cachedPermissions = [...(userData.permisos_globales || [])];
        this.initActivityMonitor();
        this.startPermissionSync();
      }),
    );
  }

  fetchUserProfile(): Observable<UserSession> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.get<any>(this.apiAuth + '/me', options).pipe(
      map((response: any) => {
        const userData = this.extractUserData(response);
        this.saveSession(userData);
        return userData;
      }),
      catchError((error) => {
        const recovery = this.getRecoveryData();
        if (recovery) {
          this._user.set(recovery);
        }
        return throwError(() => error);
      }),
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(this.apiRegister, userData);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(this.apiAuth + '/forgot-password', { email });
  }

  refreshToken(): Observable<any> {
    return this.http.post(this.apiAuth + '/refresh', {}, { withCredentials: true }).pipe(
      tap((response: any) => {
        const userData = this.extractUserData(response);
        const currentUser = this._user();
        const updatedUser: UserSession = {
          id: userData.id || currentUser?.id || '',
          email: userData.email || currentUser?.email || '',
          nombre_completo: userData.nombre_completo || currentUser?.nombre_completo || '',
          permisos_globales: userData.permisos_globales || currentUser?.permisos_globales || [],
        };
        this._user.set(updatedUser);
        this.saveToRecovery(updatedUser);
        this.lastActivity = Date.now();
        this.startPermissionSync();
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
    this.stopPermissionSync();
    this.removeActivityListeners();
    this.cachedPermissions = [];
    this.http.post(this.apiAuth + '/logout', {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._user.set(null);
    this._isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  registerPublic(userData: any): Observable<any> {
    return this.http.post(this.apiRegister, userData);
  }

  createUserByAdmin(userData: any): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.post(this.apiUsers, userData, options);
  }

  updateUserByAdmin(userId: string, data: any): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.patch(`${this.apiUsers}/${userId}`, data, options);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.patch(this.apiAuth + '/profile', profileData).pipe(
      tap((response: any) => {
        const userData = this.extractUserData(response);
        if (userData) {
          const currentUser = this._user();
          const updatedUser: UserSession = {
            id: userData.id || currentUser?.id || '',
            email: userData.email || currentUser?.email || '',
            username: userData.username ?? currentUser?.username,
            nombre_completo: userData.nombre_completo || currentUser?.nombre_completo || '',
            nombreCompleto:
              userData.nombreCompleto ||
              userData.nombre_completo ||
              currentUser?.nombreCompleto ||
              '',
            direccion: userData.direccion ?? currentUser?.direccion,
            telefono: userData.telefono ?? currentUser?.telefono,
            fecha_inicio: userData.fecha_inicio ?? currentUser?.fecha_inicio,
            fecha_nacimiento: userData.fecha_nacimiento ?? currentUser?.fecha_nacimiento,
            last_login: userData.last_login ?? currentUser?.last_login,
            permisos_globales: userData.permisos_globales || currentUser?.permisos_globales || [],
          };
          this._user.set(updatedUser);
          this.saveToRecovery(updatedUser);
        }
      }),
    );
  }

  getUser(): UserSession | null {
    const signalUser = this._user();
    if (signalUser) return signalUser;
    return this.getRecoveryData();
  }

  hasPermission(permission: string): boolean {
    const user = this._user() || this.getRecoveryData();
    if (!user || !user.permisos_globales) return false;
    return (
      user.permisos_globales.includes(permission) || user.permisos_globales.includes('superadmin')
    );
  }

  isSuperAdmin(): boolean {
    const user = this._user() || this.getRecoveryData();
    return user?.permisos_globales?.includes('superadmin') || false;
  }

  async refreshPermissions(): Promise<void> {
    await this.executePermissionSync();
  }

  getAllUsers(filters?: { q?: string; username?: string; email?: string }): Observable<any[]> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    let url = this.apiUsers;
    if (filters?.q) {
      url += `?q=${encodeURIComponent(filters.q)}`;
    } else if (filters?.username) {
      url += `?username=${encodeURIComponent(filters.username)}`;
    } else if (filters?.email) {
      url += `?email=${encodeURIComponent(filters.email)}`;
    }

    return this.http.get(url, options) as Observable<any>;
  }

  searchUsers(query: string): Observable<any> {
    return this.getAllUsers({ q: query });
  }

  getUserById(id: string): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.get<any>(`${this.apiUsers}/${id}`, options);
  }

  createUser(userData: any): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.post(this.apiUsers, userData, options);
  }

  updateUser(id: string, userData: any): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.patch(`${this.apiUsers}/${id}`, userData, options);
  }

  deleteUser(id: string): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.delete(`${this.apiUsers}/${id}`, options);
  }

  changeUserPassword(id: string): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.post(`${this.apiUsers}/${id}/change-password`, {}, options);
  }

  assignUserPermissions(id: string, permisos: string[]): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.post(`${this.apiUsers}/${id}/permissions`, { permisos }, options);
  }

  removeUserPermissions(id: string, permisos: string[]): Observable<any> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.request('delete', `${this.apiUsers}/${id}/permissions`, {
      body: { permisos },
      ...options,
    });
  }

  getAllPermissions(): Observable<any[]> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.get(`${this.apiUsers}/permissions/list`, options) as Observable<any>;
  }
}
