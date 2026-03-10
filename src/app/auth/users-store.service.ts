import { Injectable, signal } from '@angular/core';
import { Permission, Role, ROLE_PERMISSIONS } from './permissions';

const STORE_KEY = 'user_permissions_store';

type PermissionsStore = Record<string, Permission[]>;

@Injectable({ providedIn: 'root' })
export class UsersStoreService {
  private _store = signal<PermissionsStore>(this.loadStore());

  getPermissions(username: string, role: Role): Permission[] {
    return this._store()[username] ?? ROLE_PERMISSIONS[role];
  }

  updatePermissions(username: string, permissions: Permission[]): void {
    const updated = { ...this._store(), [username]: permissions };
    this._store.set(updated);
    localStorage.setItem(STORE_KEY, JSON.stringify(updated));
  }

  getStoredPermissions(username: string): Permission[] | null {
    return this._store()[username] ?? null;
  }

  private loadStore(): PermissionsStore {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
