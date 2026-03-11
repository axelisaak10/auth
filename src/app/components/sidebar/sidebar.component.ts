import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
  permission?: string;   // show only if user has this permission
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  collapsed = false;

  menuItems: MenuItem[] = [
    { label: 'Inicio',    icon: 'pi-home',        route: '/home',            active: true  },
    { label: 'Tickets',   icon: 'pi-ticket',      route: '/tickets',         active: false },
    { label: 'Perfil',    icon: 'pi-user',        route: '/profile/users',   active: false },
    { label: 'Analítica', icon: 'pi-chart-bar',   route: '/analytics/total', active: false },
    { label: 'Grupos',    icon: 'pi-folder-open', route: '/groups',          active: false, permission: 'group:view' },
    { label: 'Usuarios',  icon: 'pi-users',       route: '/admin/users',     active: false, permission: 'users:view' },
    { label: 'Ajustes',   icon: 'pi-cog',         route: '/settings',        active: false },
  ];

  get visibleItems(): MenuItem[] {
    return this.menuItems.filter(m => !m.permission || this.auth.hasPermission(m.permission as any));
  }

  constructor(private router: Router, public auth: AuthService) {}

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  navigate(item: MenuItem) {
    this.menuItems.forEach(m => m.active = false);
    item.active = true;
    this.router.navigate([item.route]);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}