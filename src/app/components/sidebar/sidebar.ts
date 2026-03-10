import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, Ripple],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  visible = input<boolean>(true);
  closeSidebar = output<void>();
  private authService = inject(AuthService);

  get menuItems(): { label: string, icon: string, route: string, fragment?: string }[] {
    const isSuperAdmin = this.authService.getUser()?.usuario === 'super_admin';
    const items: { label: string, icon: string, route: string, fragment?: string }[] = [
      { label: 'Dashboard', icon: 'pi pi-home', route: '/home' },
      { label: 'Usuarios', icon: 'pi pi-users', route: '/home/user' },
      { label: 'Grupos', icon: 'pi pi-th-large', route: '/home/group' },
    ];
    
    if (!isSuperAdmin) {
      items.push({ label: 'Tickets', icon: 'pi pi-ticket', route: '/home/tickets' });
    } else {
      items.push({ label: 'Admins. Básicos', icon: 'pi pi-user-edit', route: '/home/gestion-user' });
    }
    
    items.push({ label: 'Configuración', icon: 'pi pi-cog', route: '/home' });
    
    return items;
  }

  onOverlayClick() {
    this.closeSidebar.emit();
  }
}
