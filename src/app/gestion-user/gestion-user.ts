import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { UserSession } from '../models/types';
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
export class GestionUser {
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private confirmationService = inject(ConfirmationService);

  user: UserSession | null = null;

  // Basic Admin manage modal
  showBasicAdminDialog = false;
  basicAdminData: UserSession = this.emptyUser();
  basicAdmins: UserSession[] = [];
  
  mockGroups = [
    { label: 'Seguridad TI (group-1)', value: 'group-1' },
    { label: 'Desarrollo Web (group-2)', value: 'group-2' },
    { label: 'Marketing (group-3)', value: 'group-3' }
  ];

  constructor() {
    this.user = this.authService.getUser();
    
    // Solo si tiene permiso global admin
    if (this.permissionService.hasPermission('MANAGE_BASIC_ADMINS') || this.permissionService.hasPermission('MANAGE_USERS_GLOBAL')) {
      this.basicAdmins = [
        {
          email: 'admin@seguridad.com',
          nombre: 'Carlos Admin Básico',
          usuario: 'admin_carlos',
          telefono: '5512345679',
          direccion: 'Sucursal Norte',
          fechaNacimiento: '1995-06-15',
          groupId: 'group-1',
          permissions: ['VIEW_OWN_GROUP', 'MANAGE_GROUP_USERS', 'CREATE_TICKETS', 'EDIT_TICKETS_ALL']
        }
      ];
    }
  }

  emptyUser(): UserSession {
    return {
      email: '',
      nombre: '',
      usuario: '',
      telefono: '',
      direccion: '',
      fechaNacimiento: '',
      groupId: '',
      permissions: []
    };
  }

  // --- Basic Admin Management Methods ---

  openAddBasicAdmin(): void {
    this.basicAdminData = this.emptyUser();
    this.basicAdminData.permissions = ['VIEW_OWN_GROUP', 'MANAGE_GROUP_USERS', 'CREATE_TICKETS', 'EDIT_TICKETS_ALL']; // default permissions for basic admin
    this.showBasicAdminDialog = true;
  }

  editBasicAdmin(u: UserSession): void {
    this.basicAdminData = { ...u };
    this.showBasicAdminDialog = true;
  }

  saveBasicAdmin(): void {
    const idx = this.basicAdmins.findIndex(u => u.usuario === this.basicAdminData.usuario);
    if (idx !== -1) {
      this.basicAdmins[idx] = { ...this.basicAdminData };
    } else {
      this.basicAdmins.push({ ...this.basicAdminData });
    }
    this.showBasicAdminDialog = false;
  }

  deleteBasicAdmin(u: UserSession): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar al Administrador Básico "${u.usuario}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.basicAdmins = this.basicAdmins.filter(x => x.usuario !== u.usuario);
      }
    });
  }
}
