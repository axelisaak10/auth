import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { Avatar } from 'primeng/avatar';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { Password } from 'primeng/password';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { UserSession } from '../../models/types';
import { HasPermissionDirective } from '../../directiva/directiva';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-user',
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Tag,
    Divider,
    Avatar,
    Dialog,
    ButtonModule,
    InputText,
    DatePicker,
    Password,
    ConfirmDialog,
    HasPermissionDirective,
    TableModule,
    ToolbarModule
  ],
  providers: [ConfirmationService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  user: UserSession | null = null;
  accountSuspended = false;

  // Edit modal
  showEditDialog = false;
  editData: UserSession = this.emptyUser();
  editPassword = '';
  editConfirmPassword = '';
  editFechaNacimiento: Date | null = null;
  maxDate = new Date();

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private confirmationService: ConfirmationService,
  ) {
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

  emptyUser(): UserSession {
    return {
      email: '',
      nombre: '',
      usuario: '',
      telefono: '',
      direccion: '',
      fechaNacimiento: '',
      permissions: []
    };
  }

  openEditDialog(): void {
    if (this.user) {
      this.editData = { ...this.user };
      // Convert string date to Date object for the datepicker
      if (this.user.fechaNacimiento) {
        this.editFechaNacimiento = new Date(this.user.fechaNacimiento + 'T00:00:00');
      } else {
        this.editFechaNacimiento = null;
      }
    }
    this.editPassword = '';
    this.editConfirmPassword = '';
    this.showEditDialog = true;
  }

  saveProfile(): void {
    // Convert Date object back to string for storage
    if (this.editFechaNacimiento) {
      const d = this.editFechaNacimiento;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.editData.fechaNacimiento = `${year}-${month}-${day}`;
    }
    this.user = { ...this.editData };
    localStorage.setItem('session', JSON.stringify(this.user));
    this.showEditDialog = false;
  }

  soloNumeros(event: KeyboardEvent): void {
    const charCode = event.key;
    if (!/^\d$/.test(charCode)) {
      event.preventDefault();
    }
  }

  onPegarTelefono(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const soloDigitos = pastedText.replace(/\D/g, '');
    this.editData.telefono = soloDigitos;
  }

  suspendAccount(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas suspender tu cuenta? Tu cuenta quedará inactiva temporalmente.',
      header: 'Suspender Cuenta',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, suspender',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.accountSuspended = true;
      },
    });
  }

  reactivateAccount(): void {
    this.accountSuspended = false;
  }

}
