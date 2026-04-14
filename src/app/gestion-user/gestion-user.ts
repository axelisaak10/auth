import { Component, inject, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';

import { AuthService, UserSession } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { HasPermissionDirective } from '../directiva/directiva';

@Component({
  selector: 'app-gestion-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToolbarModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './gestion-user.html',
  styleUrl: './gestion-user.css',
})
export class GestionUser implements OnInit {
  private authService = inject(AuthService);
  public permissionService = inject(PermissionService);
  private confirmationService = inject(ConfirmationService);
  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiGateway;

  user: UserSession | null = null;

  // Basic Admin manage modal
  showBasicAdminDialog = false;
  editMode = false;
  basicAdmins: UserSession[] = [];
  basicAdminData: Partial<UserSession> = {};
  isLoading = false;

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.permissionService.hasPermission('MANAGE_BASIC_ADMINS') ||
        this.permissionService.hasPermission('MANAGE_USERS_GLOBAL')) {
      this.loadBasicAdmins();
    }
  }

  loadBasicAdmins(): void {
    this.isLoading = true;
    this.http.get<UserSession[]>(`${this.apiUrl}/users`, { withCredentials: true }).subscribe({
      next: (users) => { this.basicAdmins = users; this.isLoading = false; },
      error: (err) => { console.error('Error loading users', err); this.isLoading = false; }
    });
  }

  openAddBasicAdmin(): void {
    this.basicAdminData = {};
    this.editMode = false;
    this.showBasicAdminDialog = true;
  }

  editBasicAdmin(u: UserSession): void {
    this.basicAdminData = { ...u };
    this.editMode = true;
    this.showBasicAdminDialog = true;
  }

  saveBasicAdmin(): void {
    if (this.editMode && this.basicAdminData.id) {
      this.http.patch(`${this.apiUrl}/users/${this.basicAdminData.id}`, this.basicAdminData, { withCredentials: true }).subscribe({
        next: () => { this.loadBasicAdmins(); this.showBasicAdminDialog = false; },
        error: (err) => console.error('Error updating user', err)
      });
    } else {
      this.http.post(`${this.apiUrl}/users`, this.basicAdminData, { withCredentials: true }).subscribe({
        next: () => { this.loadBasicAdmins(); this.showBasicAdminDialog = false; },
        error: (err) => console.error('Error creating user', err)
      });
    }
  }

  deleteBasicAdmin(u: UserSession): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar a "${u.nombreCompleto}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${this.apiUrl}/users/${u.id}`, { withCredentials: true }).subscribe({
          next: () => this.loadBasicAdmins(),
          error: (err) => console.error('Error deleting user', err)
        });
      }
    });
  }
}
