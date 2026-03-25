import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { PermissionService, Permission } from '../../services/permission.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permissions?: Permission[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, Ripple],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  visible = input<boolean>(true);
  closeSidebar = output<void>();

  private ps = inject(PermissionService);

  private allMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/home' },
    { label: 'Usuarios', icon: 'pi pi-user', route: '/home/user', permissions: ['user:profile:view'] },
    { label: 'Grupos', icon: 'pi pi-th-large', route: '/home/group', permissions: ['group:view'] },
    { label: 'Gestión de Usuarios', icon: 'pi pi-shield', route: '/home/admin-users', permissions: ['user:manage'] },
  ];

  get menuItems(): MenuItem[] {
    return this.allMenuItems.filter(item =>
      !item.permissions || this.ps.hasAnyPermission(...item.permissions)
    );
  }

  onOverlayClick() {
    this.closeSidebar.emit();
  }
}
