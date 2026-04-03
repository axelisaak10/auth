import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-loyout',
  imports: [CommonModule, RouterOutlet, Button, Sidebar, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './loyout.html',
  styleUrl: './loyout.css',
})
export class Loyout {
  sidebarVisible = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
    private confirmationService: ConfirmationService,
  ) {
    this.authService.initRouterSync(this.router);
  }

  get userName(): string {
    const user = this.authService?.getUser();
    return user?.nombre_completo || user?.nombreCompleto || 'Usuario';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  toggleSidebar() {
    this.sidebarVisible.update((v) => !v);
  }

  closeSidebar() {
    this.sidebarVisible.set(false);
  }

  confirmLogout() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Cerrar Sesión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, salir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.logout();
      },
    });
  }

  logout() {
    this.authService.logout();
  }
}
