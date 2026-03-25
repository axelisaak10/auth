<<<<<<< HEAD
import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission } from '../models/permission.model';

export type { Permission } from '../models/permission.model';

@Injectable({
    providedIn: 'root',
})
export class PermissionService {

    private authService = inject(AuthService);


    private getPermissions(): Permission[] {
        const user = this.authService.getUser();
        return user?.permisos_globales ?? [];
    }

    hasPermission(permission: Permission): boolean {
        return this.getPermissions().includes(permission);
    }

    hasAnyPermission(...perms: Permission[]): boolean {
        const current = this.getPermissions();
        return perms.some(p => current.includes(p));
    }
=======
import { Injectable, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(private authService: AuthService) { }

  hasPermission(permission: Permission): boolean {
    const user = this.authService.getUser();
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    const user = this.authService.getUser();
    if (!user || !user.permissions) {
      return false;
    }
    return permissions.some(p => user.permissions.includes(p));
  }
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
}
