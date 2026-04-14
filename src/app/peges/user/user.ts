import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
import { TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { AuthService, UserSession, PermissionInfo, API_GATEWAY } from '../../services/auth.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { PermissionService } from '../../services/permission.service';
import { TicketItem } from '../group/group';
import { MessageService } from 'primeng/api';

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
    TableModule,
    Toolbar,
    Select,
    Tooltip,
    HasPermissionDirective,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  user: UserSession | null = null;
  accountSuspended = false;
  allPermissions: PermissionInfo[] = [];
  userPermissionsDetailed: PermissionInfo[] = [];

  // Edit modal
  showEditDialog = false;
  editData: UserSession = this.emptyUser();
  editPassword = '';
  editConfirmPassword = '';
  editFechaNacimiento: Date | null = null;
  maxDate = new Date();
  isSavingProfile = false;

  // ====== Tickets del usuario ======
  userTickets: TicketItem[] = [];
  showTicketStatusDialog = false;
  selectedTicket: TicketItem = this.emptyTicket();

  estadoOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En progreso', value: 'En progreso' },
    { label: 'Revisión', value: 'Revisión' },
    { label: 'Bloqueado', value: 'Bloqueado' },
    { label: 'Finalizado', value: 'Finalizado' },
  ];

  constructor(
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    public ps: PermissionService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {
    this.user = this.authService.getUser();
    this.loadUserData();
    this.loadUserTickets();
    this.loadAllPermissions();
  }

  private loadAllPermissions(): void {
    this.authService.getAllPermissions().subscribe({
      next: (response: any) => {
        this.allPermissions = response?.data || response;
        this.updateUserPermissionsDetailed();
      },
      error: (err) => console.error('Error loading permissions', err),
    });
  }

  private updateUserPermissionsDetailed(): void {
    if (!this.user?.permisos_globales || !this.allPermissions.length) return;
    const userPermNames = this.user.permisos_globales;
    this.userPermissionsDetailed = this.allPermissions.filter((p) =>
      userPermNames.includes(p.nombre)
    );
    this.cdr.detectChanges();
  }

  private loadUserData(): void {
    this.authService.fetchUserProfile().subscribe({
      next: (userData) => {
        this.user = userData;
        this.updateUserPermissionsDetailed();
        this.cdr.detectChanges();
      },
      error: () => {
        const fallback = this.authService.getUser();
        if (fallback) {
          this.user = fallback;
          this.updateUserPermissionsDetailed();
        }
        this.cdr.detectChanges();
      },
    });
  }

  get userInitial(): string {
    return this.user?.nombre_completo?.charAt(0).toUpperCase() ?? 'U';
  }

  get fechaFormateada(): string {
    if (!this.user?.fecha_nacimiento) return 'No especificada';
    const fecha = new Date(this.user.fecha_nacimiento + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /** Resumen de tickets */
  get ticketsAbiertos(): number {
    return this.userTickets.filter((t) => t.estado === 'Pendiente').length;
  }
  get ticketsEnProgreso(): number {
    return this.userTickets.filter((t) => t.estado === 'En progreso' || t.estado === 'Revisión')
      .length;
  }
  get ticketsHechos(): number {
    return this.userTickets.filter((t) => t.estado === 'Finalizado').length;
  }

  emptyUser(): UserSession {
    return {
      id: '',
      email: '',
      nombre_completo: '',
      username: '',
      telefono: '',
      direccion: '',
      fecha_inicio: '',
      fecha_nacimiento: '',
      last_login: '',
      permisos_globales: [],
      grupoId: 0,
    };
  }

  emptyTicket(): TicketItem {
    return {
      id: '',
      titulo: '',
      descripcion: '',
      estado: 'Pendiente',
      estadoId: '',
      prioridad: 'Media',
      prioridadId: '',
      asignadoA: '',
      asignadoId: '',
      creadoPor: '',
      fechaCreacion: new Date(),
      fechaLimite: null,
      fechaFinal: null,
      comentarios: '',
      historialCambios: [],
      grupoId: '',
    };
  }

  private loadUserTickets(): void {
    if (!this.user?.grupoId) return;
    const ticketsUrl = `${API_GATEWAY}/tickets?grupoId=${this.user.grupoId}`;
    this.http.get<TicketItem[]>(ticketsUrl).subscribe({
      next: (response: any) => {
        const tickets = response?.data || response;
        this.userTickets = Array.isArray(tickets) ? tickets : [];
      },
      error: (err) => console.error('Error loading user tickets', err),
    });
  }

  editTicketStatus(ticket: TicketItem): void {
    this.selectedTicket = { ...ticket, historialCambios: [...ticket.historialCambios] };
    this.showTicketStatusDialog = true;
  }

  saveTicketStatus(): void {
    const index = this.userTickets.findIndex((t) => t.id === this.selectedTicket.id);
    if (index !== -1) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      this.selectedTicket.historialCambios.push(
        `Estado cambiado a "${this.selectedTicket.estado}" el ${dateStr}`,
      );
      this.userTickets[index] = { ...this.selectedTicket };
    }
    this.showTicketStatusDialog = false;
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (estado) {
      case 'Finalizado':
        return 'success';
      case 'En progreso':
        return 'info';
      case 'Revisión':
        return 'warn';
      case 'Bloqueado':
        return 'danger';
      case 'Pendiente':
        return 'secondary';
      default:
        return 'info';
    }
  }

  getPrioridadSeverity(prioridad: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (prioridad) {
      case 'Urgente':
        return 'danger';
      case 'Alta':
      case 'Media-Alta':
        return 'warn';
      case 'Media':
      case 'Media-Baja':
        return 'info';
      case 'Baja':
      case 'Mínima':
        return 'success';
      default:
        return 'info';
    }
  }

  openEditDialog(): void {
    if (this.user) {
      this.editData = { ...this.user };
      if (this.user.fecha_nacimiento) {
        this.editFechaNacimiento = new Date(this.user.fecha_nacimiento + 'T00:00:00');
      } else {
        this.editFechaNacimiento = null;
      }
    }
    this.editPassword = '';
    this.editConfirmPassword = '';
    this.showEditDialog = true;
  }

  saveProfile(): void {
    if (this.editPassword && this.editPassword !== this.editConfirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
      });
      return;
    }

    if (this.editFechaNacimiento) {
      const d = this.editFechaNacimiento;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.editData.fecha_nacimiento = `${year}-${month}-${day}`;
    }

    this.isSavingProfile = true;

    const payload: any = {};
    if (this.editData.nombre_completo) payload.nombre_completo = this.editData.nombre_completo;
    if (this.editData.username) payload.username = this.editData.username;
    if (this.editData.email) payload.email = this.editData.email;
    if (this.editData.telefono) payload.telefono = this.editData.telefono;
    if (this.editData.direccion) payload.direccion = this.editData.direccion;
    if (this.editData.fecha_nacimiento) payload.fecha_nacimiento = this.editData.fecha_nacimiento;

    if (this.editPassword) {
      payload.password = this.editPassword;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.showEditDialog = false;
        const updatedUser = { ...payload };
        if (payload.nombre_completo) {
          updatedUser.nombreCompleto = payload.nombre_completo;
        }
        this.user = { ...this.user!, ...updatedUser };
        const safeSession = { ...this.user };
        delete (safeSession as any).password;
        localStorage.setItem('session', JSON.stringify(safeSession));
        this.messageService.add({
          severity: 'success',
          summary: 'Perfil Actualizado',
          detail: 'Tus datos se han guardado correctamente',
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo actualizar el perfil',
        });
        this.cdr.detectChanges();
      },
    });
  }

  soloNumeros(event: KeyboardEvent): void {
    if (!/^\d$/.test(event.key)) {
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
      message:
        '¿Estás seguro de que deseas suspender tu cuenta? Tu cuenta quedará inactiva temporalmente.',
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
