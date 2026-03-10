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
}
