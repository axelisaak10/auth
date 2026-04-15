import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, tap, catchError, throwError, lastValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { EventSourceService } from './event-source.service';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

export interface PermissionInfo {
  nombre: string;
  descripcion: string;
}

export interface GrupoPermisos {
  id: string;
  nombre: string;
  permisos: string[];
}

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
  permisos_detailed?: PermissionInfo[];
  grupoId?: number;
  grupos?: GrupoPermisos[];
  permisos_por_grupo?: GrupoPermisos[];
}

export const API_GATEWAY = environment.apiGateway;

const STORAGE_KEY = '_user_recovery';

const SYNC_CONFIG = {
  SYNC_INTERVAL: 86400000,
  INACTIVITY_THRESHOLD: 300000,
  MAX_FAILURES: 3,
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private eventSourceService = inject(EventSourceService);
  private notificationService = inject(NotificationService);

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
  private externalTicketCallbacks: ((type: string, data: any) => void)[] = [];
  private externalPermissionsCallbacks: (() => void)[] = [];

  constructor() {
    this.initializeFromRecovery();
    if (this.checkRecovery()) {
      setTimeout(() => {
        this.eventSourceService.setPermissionsCallback(() => {
          this.refreshPermissions();
          this.notificationService.permissionsUpdated();
          // Notificar a todos los componentes registrados
          this.externalPermissionsCallbacks.forEach(cb => cb());
        });
        
        // Configurar callback para notificaciones de tickets
        this.eventSourceService.setTicketCallback((type: string, data: any) => {
          switch (type) {
            case 'ticket-created':
              this.notificationService.ticketCreated(data.ticket?.titulo || 'Nuevo ticket');
              break;
            case 'ticket-updated':
              this.notificationService.ticketUpdated(data.ticket?.titulo || 'Ticket');
              break;
            case 'ticket-state-changed':
              this.notificationService.ticketStateChanged(data.ticket?.titulo || 'Ticket');
              break;
            case 'ticket-deleted':
              this.notificationService.ticketDeleted(data.ticketId);
              break;
          }
          // Notificar a todos los componentes registrados
          this.externalTicketCallbacks.forEach(cb => cb(type, data));
        });
        
        this.eventSourceService.connect();
      }, 1000);
    }
  }

  // Métodos públicos para que los componentes se suscriban a eventos SSE
  registerTicketCallback(callback: (type: string, data: any) => void): void {
    this.externalTicketCallbacks.push(callback);
  }

  registerPermissionsCallback(callback: () => void): void {
    this.externalPermissionsCallbacks.push(callback);
  }

  unregisterTicketCallback(callback: (type: string, data: any) => void): void {
    const index = this.externalTicketCallbacks.indexOf(callback);
    if (index > -1) {
      this.externalTicketCallbacks.splice(index, 1);
    }
  }

  unregisterPermissionsCallback(callback: () => void): void {
    const index = this.externalPermissionsCallbacks.indexOf(callback);
    if (index > -1) {
      this.externalPermissionsCallbacks.splice(index, 1);
    }
  }

  private initializeFromRecovery(): void {
    if (this.isInitialized) return;

    const recovery = this.getRecoveryData();
    if (recovery && recovery.id) {
      this._user.set(recovery);
      this.cachedPermissions = [...(recovery.permisos_globales || [])];
      this._isLoggedIn.set(true);

      const storedToken = localStorage.getItem('_access_token');
      if (storedToken) {
        this.eventSourceService.setPermissionsCallback(() => this.refreshPermissions());
      }
    }
    this.isInitialized = true;
  }

  user = computed(() => this._user());
  isLoggedIn = computed(() => this._isLoggedIn());
  userPermissions = computed(() => {
    const user = this._user();
    const globales = user?.permisos_globales || [];
    const deGrupos = user?.grupos?.flatMap((g) => g.permisos || []) || [];
    const todos = [...new Set([...globales, ...deGrupos])];
    return todos;
  });

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

  private updateUserPermissions(permissions: string[], grupos: GrupoPermisos[] = []): void {
    const current = this._user() || this.getRecoveryData() || { id: '', email: '' };
    const updated: UserSession = {
      ...current,
      permisos_globales: permissions,
      grupos: grupos,
    };
    this._user.set(updated);
    this.saveToRecovery(updated);
    this.cachedPermissions = [...permissions];
  }

  private async fetchPermissionsFromServer(): Promise<{
    permisos: string[];
    grupos: GrupoPermisos[];
  }> {
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    const response: any = await lastValueFrom(
      this.http.get<any>(`${this.apiAuth}/permissions`, options),
    );

    const unwrapped = this.extractUserData(response);
    return {
      permisos: unwrapped?.permisos_globales || response?.permisos_globales || [],
      grupos: unwrapped?.permisos_por_grupo || response?.permisos_por_grupo || [],
    };
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
      const { permisos, grupos } = await this.fetchPermissionsFromServer();

      if (this.permissionsHaveChanged(permisos)) {
        this.updateUserPermissions(permisos, grupos);
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
        // No consultamos permisos en cada navegación
        // Los permisos se actualizan automáticamente cada 24 horas
        // y manualmente cuando el admin cambia permisos
      });
  }

  private async executePermissionSyncImmediate(): Promise<void> {
    if (this.isSyncing) return;
    if (this.consecutiveFailures >= SYNC_CONFIG.MAX_FAILURES) return;

    const token = this.getToken();
    if (!token) return;

    this.isSyncing = true;

    try {
      const { permisos, grupos } = await this.fetchPermissionsFromServer();

      if (this.permissionsHaveChanged(permisos)) {
        this.updateUserPermissions(permisos, grupos);
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
    return this.getTokenFromCookie() || localStorage.getItem('_access_token');
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

  private saveSession(userData: UserSession, accessToken?: string): void {
    const currentUser = this._user();
    
    const sessionData: UserSession = {
      id: userData.id || currentUser?.id || '',
      email: userData.email || currentUser?.email || '',
      username: userData.username || currentUser?.username || '',
      nombre_completo: userData.nombre_completo || currentUser?.nombre_completo || '',
      nombreCompleto: userData.nombreCompleto || userData.nombre_completo || currentUser?.nombre_completo || '',
      direccion: userData.direccion || currentUser?.direccion || '',
      telefono: userData.telefono || currentUser?.telefono || '',
      fecha_inicio: userData.fecha_inicio || currentUser?.fecha_inicio || '',
      fecha_nacimiento: userData.fecha_nacimiento || currentUser?.fecha_nacimiento || '',
      last_login: userData.last_login || currentUser?.last_login || '',
      permisos_globales: userData.permisos_globales || currentUser?.permisos_globales || [],
      grupos: (userData.grupos && userData.grupos.length > 0) 
        ? userData.grupos 
        : currentUser?.grupos || [],
    };

    this._user.set(sessionData);
    this._isLoggedIn.set(true);

    this.saveToRecovery(sessionData);

    if (accessToken) {
      localStorage.setItem('_access_token', accessToken);
    }
  }

  private saveToRecovery(data: UserSession): void {
    try {
      const recoveryData = {
        id: data.id,
        email: data.email,
        permisos_globales: data.permisos_globales,
        grupos: data.grupos,
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
        grupos: parsed.grupos || [],
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
    console.log('[AUTH] Login request:', { email: credentials.email });
    return this.http.post(this.apiAuth + '/login', credentials, { withCredentials: true }).pipe(
      tap((response: any) => {
        console.log('[AUTH] Login response:', {
          hasAccessToken: !!response?.access_token,
          hasData: !!response?.data,
          responseKeys: Object.keys(response || {}),
        });
        const userData = this.extractUserData(response);
        console.log('[AUTH] Extracted user data:', {
          id: userData?.id,
          email: userData?.email,
          permisos_globales: userData?.permisos_globales,
          grupos: userData?.grupos,
        });
        const token = response?.access_token || response?.data?.access_token;
        this.saveSession(userData, token);
        this.cachedPermissions = [...(userData.permisos_globales || [])];
        this.initActivityMonitor();
        this.startPermissionSync();
        this.eventSourceService.setPermissionsCallback(() => this.refreshPermissions());

        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 500;

        const tryConnect = () => {
          retryCount++;
          this.eventSourceService.connect();

          if (retryCount < maxRetries) {
            setTimeout(() => {
              if (!this.eventSourceService.isConnected()) {
                tryConnect();
              }
            }, retryDelay);
          }
        };

        setTimeout(tryConnect, 200);
      }),
    );
  }

  fetchUserProfile(): Observable<UserSession> {
    console.log('[AUTH] Fetching user profile...');
    const token = this.getToken();
    const options: any = { withCredentials: true };
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.get<any>(this.apiAuth + '/me', options).pipe(
      map((response: any) => {
        console.log('[AUTH] /me response:', {
          hasData: !!response?.data,
          responseKeys: Object.keys(response || {}),
        });
        const userData = this.extractUserData(response);
        console.log('[AUTH] /me user data:', {
          id: userData?.id,
          email: userData?.email,
          permisos_globales: userData?.permisos_globales,
          grupos: userData?.grupos,
        });
        this.saveSession(userData);
        return userData;
      }),
      catchError((error) => {
        console.error('[AUTH] /me error:', error);
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
    this.eventSourceService.disconnect();
    this.cachedPermissions = [];
    this.http.post(this.apiAuth + '/logout', {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('_access_token');
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
    if (!user) return false;

    if (user.permisos_globales?.includes(permission)) return true;
    if (user.permisos_globales?.includes('superadmin')) return true;

    if (user.grupos && user.grupos.length > 0) {
      for (const grupo of user.grupos) {
        if (grupo.permisos?.includes(permission)) return true;
      }
    }

    return false;
  }

  hasGroupPermission(grupoId: string, permission: string): boolean {
    const user = this._user() || this.getRecoveryData();
    if (!user || !user.grupos) return false;

    if (user.permisos_globales?.includes('superadmin')) return true;

    const grupo = user.grupos.find((g) => g.id === grupoId);
    if (!grupo) return false;

    return grupo.permisos?.includes(permission);
  }

  getGroups(): { id: string; nombre: string; permisos: string[] }[] {
    const user = this._user() || this.getRecoveryData();
    return user?.grupos || [];
  }

  isMemberOf(grupoId: string): boolean {
    const user = this._user() || this.getRecoveryData();
    if (!user || !user.grupos) return false;
    return user.grupos.some((g) => g.id === grupoId);
  }

  getUserPermissionsForGroup(grupoId: string): string[] {
    const user = this._user() || this.getRecoveryData();
    if (!user || !user.grupos) return [];
    const grupo = user.grupos.find((g) => g.id === grupoId);
    return grupo?.permisos || [];
  }

  hasGlobalPermission(permission: string): boolean {
    const user = this._user() || this.getRecoveryData();
    if (!user) return false;
    if (user.permisos_globales?.includes('superadmin')) return true;
    return user.permisos_globales?.includes(permission) || false;
  }

  isSuperAdmin(): boolean {
    const user = this._user() || this.getRecoveryData();
    return user?.permisos_globales?.includes('superadmin') || false;
  }

  async refreshPermissions(): Promise<void> {
    await this.executePermissionSyncImmediate();
    try {
      await lastValueFrom(this.refreshToken());
    } catch (error) {
      console.warn('No se pudo refresh el token después de actualizar permisos:', error);
    }
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
