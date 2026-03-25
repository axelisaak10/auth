import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Ripple } from 'primeng/ripple';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, Ripple],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  visible = input<boolean>(true);
  closeSidebar = output<void>();

  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/home' },
    { label: 'Usuarios', icon: 'pi pi-users', route: '/home/user' },
    { label: 'Grupos', icon: 'pi pi-th-large', route: '/home/group' },
    { label: 'Reportes', icon: 'pi pi-chart-bar', route: '/home' },
    { label: 'Configuración', icon: 'pi pi-cog', route: '/home' },
  ];

  onOverlayClick() {
    this.closeSidebar.emit();
  }
}
