import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { Avatar } from 'primeng/avatar';
import { AuthService, UserSession } from '../../services/auth.service';

@Component({
  selector: 'app-user',
  imports: [CommonModule, Card, Tag, Divider, Avatar],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  user: UserSession | null = null;

  constructor(private authService: AuthService) {
    this.user = this.authService.getUser();
  }

  get userInitial(): string {
    return this.user?.nombre?.charAt(0).toUpperCase() ?? 'U';
  }

  get fechaFormateada(): string {
    if (!this.user?.fechaNacimiento) return '';
    const fecha = new Date(this.user.fechaNacimiento + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
