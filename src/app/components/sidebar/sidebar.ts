import { Component, input, output, inject, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { PermissionService, Permission } from '../../services/permission.service';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permissions?: Permission[];
  groupPermissions?: { grupoId: string; permission: string }[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, Ripple],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit, OnDestroy {
  visible = input<boolean>(true);
  closeSidebar = output<void>();

  private ps = inject(PermissionService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private permissionsCallback = () => {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  };

  private allMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/home' },
    {
      label: 'Usuarios',
      icon: 'pi pi-user',
      route: '/home/user',
      permissions: ['user:profile:view'],
    },
    { label: 'Grupos', icon: 'pi pi-th-large', route: '/home/group', permissions: ['group:view'] },
    { label: 'Tickets', icon: 'pi pi-ticket', route: '/home/tickets', permissions: ['group:view'] },
    {
      label: 'Gestión de Usuarios',
      icon: 'pi pi-shield',
      route: '/home/admin-users',
      permissions: ['user:manage'],
    },
  ];

  get menuItems(): MenuItem[] {
    this.authService.userPermissions();
    return this.allMenuItems.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      
      return item.permissions.some((perm) => this.ps.hasPermission(perm as Permission));
    });
  }

  onOverlayClick() {
    this.closeSidebar.emit();
  }

  ngOnInit(): void {
    this.authService.registerPermissionsCallback(this.permissionsCallback);
  }

  ngOnDestroy(): void {
    this.authService.unregisterPermissionsCallback(this.permissionsCallback);
  }
}
