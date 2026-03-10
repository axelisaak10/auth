import { Injectable, signal, computed, inject } from '@angular/core';
import { Permission, Role } from './permissions';
import { UsersStoreService } from './users-store.service';

export interface User {
  username: string;
  role: Role;
  area: string;
  permissions: Permission[];
}

interface Credential {
  username: string;
  password: string;
  role: Role;
  area: string;
}

const CREDENTIALS: Credential[] = [
  { username: 'admin',    password: 'Admin@2024!', role: 'admin', area: 'Administración' },
  { username: 'usuario1', password: 'User@1234#',  role: 'user',  area: 'IT'             },
  { username: 'usuario2', password: 'User@2234#',  role: 'user',  area: 'Desarrollo'     },
  { username: 'usuario3', password: 'User@3234#',  role: 'user',  area: 'Soporte'        },
];

export const USER_LIST = CREDENTIALS
  .filter(c => c.role === 'user')
  .map(c => ({ username: c.username, area: c.area }));

export const ALL_USERS = CREDENTIALS
  .map(c => ({ username: c.username, role: c.role, area: c.area }));

const SESSION_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usersStore = inject(UsersStoreService);
  private _currentUser = signal<User | null>(this.loadSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn  = computed(() => this._currentUser() !== null);

  login(username: string, password: string): boolean {
    const cred = CREDENTIALS.find(
      c => c.username === username.trim() && c.password === password
    );
    if (!cred) return false;

    const user: User = {
      username: cred.username,
      role: cred.role,
      area: cred.area,
      permissions: this.usersStore.getPermissions(cred.username, cred.role),
    };
    this._currentUser.set(user);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  }

  logout(): void {
    this._currentUser.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  hasPermission(permission: Permission): boolean {
    return this._currentUser()?.permissions.includes(permission) ?? false;
  }

  private loadSession(): User | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
