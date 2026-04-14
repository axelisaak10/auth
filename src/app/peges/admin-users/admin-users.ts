import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
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
  permisos_globales_detailed?: { id: string; nombre: string; descripcion: string }[];
}

interface PermissionItem {
  id: string;
  nombre: string;
  descripcion: string;
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
  allPermissions: PermissionItem[] = [];
  private permissionNameToId: Map<string, string> = new Map();

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
  permissionsUserNames: string[] = [];
  isSavingPerms = false;

  ngOnInit() {
    this.loadPermissions();
    this.loadUsers();
  }

  loadPermissions() {
    this.authService.getAllPermissions().subscribe({
      next: (response: any) => {
        const rawPerms =
          response?.data?.[0]?.data || response?.data || response?.permissions || response || [];
        const permsArray = Array.isArray(rawPerms) ? rawPerms : [];
        this.allPermissions = permsArray.map((p: any) => {
          const id = p.id || p.nombre;
          this.permissionNameToId.set(p.nombre, id);
          return {
            id: id,
            nombre: p.nombre,
            descripcion: p.descripcion || p.nombre,
          };
        });
      },
      error: (err) => console.error('Error fetching permissions', err),
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.authService.getAllUsers().subscribe({
      next: (users: any) => {
        const rawData = users?.data?.[0]?.data || users?.data || users || [];
        const usersArray = Array.isArray(rawData) ? rawData : [];
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
          permisos_globales_detailed: u.permisos_globales_detailed || [],
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios',
        });
        this.cdr.detectChanges();
      },
    });
  }

  get filteredUsers(): AdminUser[] {
    if (!this.searchText.trim()) return this.allUsers;
    const term = this.searchText.toLowerCase().trim();
    return this.allUsers.filter(
      (u) =>
        u.nombre_completo.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term),
    );
  }

  emptyUser(): AdminUser {
    return {
      id: '',
      nombre_completo: '',
      username: '',
      email: '',
      telefono: '',
      direccion: '',
      fecha_nacimiento: '',
      fecha_inicio: '',
      last_login: '',
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
    if (
      !this.selectedUser.nombre_completo ||
      !this.selectedUser.username ||
      !this.selectedUser.email
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Nombre, usuario y email son obligatorios',
      });
      return;
    }

    if (!this.editUserMode && !this.editPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'La contraseña es obligatoria para crear un usuario',
      });
      return;
    }

    if (this.editPassword && this.editPassword !== this.editConfirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
      });
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
        nombre_completo: this.selectedUser.nombre_completo,
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
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario actualizado correctamente',
          });
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar el usuario',
          });
        },
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
        permisos_globales: this.selectedUser.permisos_globales.map(
          (p) => this.permissionNameToId.get(p) || p,
        ),
      };
      if (fechaNac) payload.fecha_nacimiento = fechaNac;

      // Convertir nombreCompleto a nombre_completo para el backend
      payload.nombre_completo = this.selectedUser.nombre_completo;
      delete payload.nombreCompleto;

      this.authService.createUserByAdmin(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.showUserDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario creado correctamente',
          });
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo crear el usuario',
          });
        },
      });
    }
  }

  changePasswordFromModal(): void {
    if (!this.selectedUser?.id) return;

    this.confirmationService.confirm({
      message: '¿Generar nueva contraseña para este usuario? Se enviará a su correo.',
      header: 'Generar Contraseña',
      icon: 'pi pi-key',
      acceptLabel: 'Sí, generar y enviar',
      accept: () => {
        this.authService.changeUserPassword(this.selectedUser.id).subscribe({
          next: (response: any) => {
            this.messageService.add({
              severity: 'success',
              summary: '✅ Generada exitosamente',
              detail: 'Se envió correo al usuario con su nueva contraseña',
            });
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'No se pudo generar la contraseña',
            });
          },
        });
      },
    });
  }

  deleteUser(user: AdminUser): void {
    this.confirmationService.confirm({
      message: `¿Suspender al usuario "${user.nombre_completo}"? Se le quitarán todos sus permisos.`,
      header: 'Confirmar Suspensión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, suspender',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.authService.deleteUser(user.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Suspendido',
              detail: 'Usuario suspendido correctamente',
            });
            this.loadUsers();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'No se pudo suspender el usuario',
            });
          },
        });
      },
    });
  }

  changePassword(user: AdminUser): void {
    this.confirmationService.confirm({
      message: `¿Generar nueva contraseña para "${user.nombre_completo}"? Se enviará al correo del usuario.`,
      header: 'Cambiar Contraseña',
      icon: 'pi pi-key',
      acceptLabel: 'Sí, generar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.authService.changeUserPassword(user.id).subscribe({
          next: (response: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: response.emailSent
                ? 'Contraseña actualizada y enviada al correo del usuario'
                : 'Contraseña actualizada pero el email no pudo ser enviado',
            });
            this.loadUsers();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'No se pudo cambiar la contraseña',
            });
          },
        });
      },
    });
  }

  // ====== Permissions ======
  openPermissions(user: AdminUser): void {
    this.permissionsUser = { ...user, permisos_globales: [...(user.permisos_globales || [])] };
    this.permissionsUserNames = user.permisos_globales_detailed?.map((p) => p.nombre) || [];
    setTimeout(() => {
      this.showPermissionsDialog = true;
      this.cdr.detectChanges();
    });
  }

  hasPermissionCheck(permName: string): boolean {
    return this.permissionsUserNames.includes(permName);
  }

  togglePermission(permName: string): void {
    const idx = this.permissionsUserNames.indexOf(permName);
    if (idx >= 0) {
      this.permissionsUserNames.splice(idx, 1);
    } else {
      this.permissionsUserNames.push(permName);
    }
  }

  getPermissionDescription(permId: string): string {
    const perm = this.allPermissions.find((p) => p.id === permId || p.nombre === permId);
    return perm?.descripcion || perm?.nombre || permId;
  }

  getPermissionName(permId: string): string {
    const perm = this.allPermissions.find((p) => p.id === permId || p.nombre === permId);
    return perm?.nombre || permId;
  }

  savePermissions(): void {
    this.isSavingPerms = true;

    const newPermsNames = this.permissionsUserNames || [];
    const permisosUUIDs = newPermsNames
      .map((n) => this.permissionNameToId.get(n))
      .filter((id) => id !== undefined);

    this.authService.assignUserPermissions(this.permissionsUser.id, permisosUUIDs).subscribe({
      next: () => {
        this.isSavingPerms = false;
        this.showPermissionsDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Permisos actualizados correctamente',
        });
        this.loadUsers();
        this.authService.refreshPermissions();
      },
      error: (err) => {
        this.isSavingPerms = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudieron guardar los permisos',
        });
      },
    });
  }

  // Helpers
  soloNumeros(event: KeyboardEvent): void {
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }

  formatLastLogin(date: string): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
