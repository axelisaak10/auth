import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-loyout',
  imports: [CommonModule, RouterOutlet, Button, Sidebar],
  templateUrl: './loyout.html',
  styleUrl: './loyout.css',
})
export class Loyout {
  sidebarVisible = signal(false);

  constructor(public authService: AuthService) { }

  get userName(): string {
    return this.authService.getUser()?.nombreCompleto ?? 'Usuario';
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

  logout() {
    this.authService.logout();
  }
}
