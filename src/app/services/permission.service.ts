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
}
