import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission } from '../models/permission.model';

export type { Permission } from '../models/permission.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private authService = inject(AuthService);

  private _permissions = computed(() => this.authService.userPermissions());
  private _isSuperAdmin = computed(() => this.authService.isSuperAdmin());

  hasPermission(permission: Permission): boolean {
    if (this._isSuperAdmin()) {
      return true;
    }
    return this._permissions().includes(permission);
  }

  hasAnyPermission(...perms: Permission[]): boolean {
    if (this._isSuperAdmin()) {
      return true;
    }
    const current = this._permissions();
    return perms.some((p) => current.includes(p));
  }
}
