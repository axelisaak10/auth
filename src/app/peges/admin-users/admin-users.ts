import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { Password } from 'primeng/password';
import { DatePicker } from 'primeng/datepicker';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { PermissionService } from '../../services/permission.service';
import { AuthService } from '../../services/auth.service';
import { Toast } from 'primeng/toast';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

interface AdminUser {
  id: string;
  nombre_completo: string;
  username: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  fecha_inicio: string;
  last_login: string;
  permisos_globales: string[];
}

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Dialog,
    ButtonModule,
    InputText,
    Tag,
    Toolbar,
    ConfirmDialog,
    Tooltip,
    Password,
    DatePicker,
    HasPermissionDirective,
    Toast,
    IconField,
    InputIcon,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  ps = inject(PermissionService);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  // Permisos disponibles (del backend)
  allPermissions: string[] = [];

  // Lista de usuarios (del backend)
  allUsers: AdminUser[] = [];
  isLoading = true;

  // Búsqueda
  searchText = '';

  // ====== User Dialog ======
  showUserDialog = false;
  editUserMode = false;
  selectedUser: AdminUser = this.emptyUser();
  editPassword = '';
  editConfirmPassword = '';
  editFechaNacimiento: Date | null = null;
  maxDate = new Date();
  isSaving = false;

  // ====== Permissions Dialog ======
  showPermissionsDialog = false;
  permissionsUser: AdminUser = this.emptyUser();
  isSavingPerms = false;

  ngOnInit() {
    this.loadPermissions();
    this.loadUsers();
  }

  loadPermissions() {
    this.authService.getAllPermissions().subscribe({
      next: (response: any) => {
        const permsArray = response.permissions || response;
        this.allPermissions = Array.isArray(permsArray) && typeof permsArray[0] === 'string'
          ? permsArray
          : Array.isArray(permsArray) ? (permsArray as any[]).map(p => p.nombre || p) : [];
      },
      error: (err) => console.error('Error fetching permissions', err)
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.authService.getAllUsers().subscribe({
      next: (users: any) => {
        const usersArray = Array.isArray(users) ? users : (users.data || []);
        this.allUsers = usersArray.map((u: any) => ({
          id: u.id,
          nombre_completo: u.nombre_completo || u.nombreCompleto || '',
          username: u.username || '',
          email: u.email || '',
          telefono: u.telefono || '',
          direccion: u.direccion || '',
          fecha_nacimiento: u.fecha_nacimiento || '',
          fecha_inicio: u.fecha_inicio || '',
          last_login: u.last_login || '',
          permisos_globales: u.permisos_globales || [],
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios. Verifica que el endpoint GET /users exista en tu backend.' });
        this.cdr.detectChanges();
      }
    });
  }

  get filteredUsers(): AdminUser[] {
    if (!this.searchText.trim()) return this.allUsers;
    const term = this.searchText.toLowerCase().trim();
    return this.allUsers.filter(u =>
      u.nombre_completo.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term)
    );
  }

  emptyUser(): AdminUser {
    return {
      id: '', nombre_completo: '', username: '', email: '', telefono: '',
      direccion: '', fecha_nacimiento: '', fecha_inicio: '', last_login: '',
      permisos_globales: [],
    };
  }

  // ====== User CRUD ======
  openNewUser(): void {
    this.selectedUser = this.emptyUser();
    this.editUserMode = false;
    this.editPassword = '';
    this.editConfirmPassword = '';
    this.editFechaNacimiento = null;
    this.showUserDialog = true;
  }

  editUser(user: AdminUser): void {
    this.selectedUser = { ...user, permisos_globales: [...user.permisos_globales] };
    this.editUserMode = true;
    this.editPassword = '';
    this.editConfirmPassword = '';
    if (user.fecha_nacimiento) {
      this.editFechaNacimiento = new Date(user.fecha_nacimiento + 'T00:00:00');
    } else {
      this.editFechaNacimiento = null;
    }
    this.showUserDialog = true;
  }

  saveUser(): void {
    // Validaciones
    if (!this.selectedUser.nombre_completo || !this.selectedUser.username || !this.selectedUser.email) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Nombre, usuario y email son obligatorios' });
      return;
    }

    if (!this.editUserMode && !this.editPassword) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La contraseña es obligatoria para crear un usuario' });
      return;
    }

    if (this.editPassword && this.editPassword !== this.editConfirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
      return;
    }

    // Formatear fecha de nacimiento
    let fechaNac = '';
    if (this.editFechaNacimiento) {
      const d = this.editFechaNacimiento;
      fechaNac = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    this.isSaving = true;

    if (this.editUserMode) {
      // --- EDITAR usuario existente ---
      const payload: any = {
        nombreCompleto: this.selectedUser.nombre_completo,
        username: this.selectedUser.username,
        email: this.selectedUser.email,
        telefono: this.selectedUser.telefono,
        direccion: this.selectedUser.direccion,
      };
      if (fechaNac) payload.fecha_nacimiento = fechaNac;
      if (this.editPassword) payload.password = this.editPassword;

      this.authService.updateUserByAdmin(this.selectedUser.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showUserDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente' });
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo actualizar el usuario' });
        }
      });
    } else {
      // --- CREAR nuevo usuario ---
      const payload: any = {
        nombreCompleto: this.selectedUser.nombre_completo,
        username: this.selectedUser.username,
        email: this.selectedUser.email,
        password: this.editPassword,
        telefono: this.selectedUser.telefono || undefined,
        direccion: this.selectedUser.direccion || undefined,
        permisos: this.selectedUser.permisos_globales,
      };
      if (fechaNac) payload.fecha_nacimiento = fechaNac;

      this.authService.createUserByAdmin(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showUserDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente' });
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo crear el usuario' });
        }
      });
    }
  }

  deleteUser(user: AdminUser): void {
    this.confirmationService.confirm({
      message: `¿Eliminar al usuario "${user.nombre_completo}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.authService.deleteUser(user.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado correctamente' });
            this.loadUsers();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar el usuario' });
          }
        });
      },
    });
  }

  // ====== Permissions ======
  openPermissions(user: AdminUser): void {
    this.permissionsUser = { ...user, permisos_globales: [...(user.permisos_globales || [])] };
    // Defer dialog open to next tick to prevent NG0100
    setTimeout(() => {
      this.showPermissionsDialog = true;
      this.cdr.detectChanges();
    });
  }

  hasPermissionCheck(perm: string): boolean {
    return this.permissionsUser.permisos_globales.includes(perm);
  }

  togglePermission(perm: string): void {
    const idx = this.permissionsUser.permisos_globales.indexOf(perm);
    if (idx >= 0) {
      this.permissionsUser.permisos_globales.splice(idx, 1);
    } else {
      this.permissionsUser.permisos_globales.push(perm);
    }
  }

  savePermissions(): void {
    this.isSavingPerms = true;
    this.authService.updateUserByAdmin(this.permissionsUser.id, {
      permisos: this.permissionsUser.permisos_globales
    }).subscribe({
      next: () => {
        this.isSavingPerms = false;
        this.showPermissionsDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Permisos actualizados correctamente' });
        this.loadUsers();
      },
      error: (err) => {
        this.isSavingPerms = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudieron guardar los permisos' });
      }
    });
  }

  // Helpers
  soloNumeros(event: KeyboardEvent): void {
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }

  formatLastLogin(date: string): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
