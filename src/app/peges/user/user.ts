import { Component, ChangeDetectorRef } from '@angular/core';
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
<<<<<<< HEAD
import { TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { AuthService, UserSession } from '../../services/auth.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { PermissionService } from '../../services/permission.service';
import { TicketItem } from '../group/group';
import { MessageService } from 'primeng/api';
=======
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { UserSession } from '../../models/types';
import { HasPermissionDirective } from '../../directiva/directiva';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb

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
<<<<<<< HEAD
    TableModule,
    Toolbar,
    Select,
    Tooltip,
    HasPermissionDirective,
=======
    HasPermissionDirective,
    TableModule,
    ToolbarModule
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
  ],
  providers: [ConfirmationService, MessageService],
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
    private permissionService: PermissionService,
    private confirmationService: ConfirmationService,
    public ps: PermissionService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getUser();
    this.loadUserTickets();
  }

  get userInitial(): string {
    return this.user?.nombreCompleto?.charAt(0).toUpperCase() ?? 'U';
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
    return this.userTickets.filter(t => t.estado === 'Pendiente').length;
  }
  get ticketsEnProgreso(): number {
    return this.userTickets.filter(t => t.estado === 'En progreso' || t.estado === 'Revisión').length;
  }
  get ticketsHechos(): number {
    return this.userTickets.filter(t => t.estado === 'Finalizado').length;
  }

  emptyUser(): UserSession {
    return {
      id: '',
      email: '',
<<<<<<< HEAD
      nombreCompleto: '',
      username: '',
      telefono: '',
      direccion: '',
      fecha_inicio: '',
      fecha_nacimiento: '',
      last_login: '',
      permisos_globales: [],
      grupoId: 0,
=======
      nombre: '',
      usuario: '',
      telefono: '',
      direccion: '',
      fechaNacimiento: '',
      permissions: []
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
    };
  }

  emptyTicket(): TicketItem {
    return {
      id: 0,
      titulo: '',
      descripcion: '',
      estado: 'Pendiente',
      asignadoA: '',
      creadoPor: '',
      prioridad: 'Media',
      fechaCreacion: new Date(),
      fechaLimite: null,
      comentarios: '',
      historialCambios: [],
      grupoId: 0,
    };
  }

  /** Carga los tickets que pertenecen al grupo del usuario */
  private loadUserTickets(): void {
    if (!this.user?.grupoId) return;
    // Mock tickets del grupo del usuario
    this.userTickets = [
      {
        id: 1,
        titulo: 'Auditoría de accesos',
        descripcion: 'Revisar los logs de acceso del último mes.',
        estado: 'Pendiente',
        asignadoA: 'María López',
        creadoPor: 'Carlos Administrador',
        prioridad: 'Alta',
        fechaCreacion: new Date('2026-03-01'),
        fechaLimite: new Date('2026-03-15'),
        comentarios: '',
        historialCambios: ['Creado el 01/03/2026'],
        grupoId: 1,
      },
      {
        id: 2,
        titulo: 'Actualizar firewall',
        descripcion: 'Configurar nuevas reglas de firewall para el servidor principal.',
        estado: 'En progreso',
        asignadoA: 'Carlos Administrador',
        creadoPor: 'María López',
        prioridad: 'Urgente',
        fechaCreacion: new Date('2026-02-28'),
        fechaLimite: new Date('2026-03-10'),
        comentarios: 'Coordinando con el proveedor.',
        historialCambios: ['Creado el 28/02/2026', 'Asignado a Carlos 01/03/2026'],
        grupoId: 1,
      },
    ].filter(t => t.grupoId === this.user!.grupoId);
  }

  // ====== Ticket Status Edit ======
  editTicketStatus(ticket: TicketItem): void {
    this.selectedTicket = { ...ticket, historialCambios: [...ticket.historialCambios] };
    this.showTicketStatusDialog = true;
  }

  saveTicketStatus(): void {
    const index = this.userTickets.findIndex(t => t.id === this.selectedTicket.id);
    if (index !== -1) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      this.selectedTicket.historialCambios.push(`Estado cambiado a "${this.selectedTicket.estado}" el ${dateStr}`);
      this.userTickets[index] = { ...this.selectedTicket };
    }
    this.showTicketStatusDialog = false;
  }

  // ====== Helpers ======
  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (estado) {
      case 'Finalizado': return 'success';
      case 'En progreso': return 'info';
      case 'Revisión': return 'warn';
      case 'Bloqueado': return 'danger';
      case 'Pendiente': return 'secondary';
      default: return 'info';
    }
  }

  getPrioridadSeverity(prioridad: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (prioridad) {
      case 'Urgente': return 'danger';
      case 'Alta':
      case 'Media-Alta': return 'warn';
      case 'Media':
      case 'Media-Baja': return 'info';
      case 'Baja':
      case 'Mínima': return 'success';
      default: return 'info';
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
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Las contraseñas no coinciden' });
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
    
    // Crear el payload a enviar al backend
    // Según requerimiento de la nota de seguridad: solo mandar los campos a actalizar.
    const payload: any = {};
    if (this.editData.nombreCompleto) payload.nombreCompleto = this.editData.nombreCompleto;
    if (this.editData.username) payload.username = this.editData.username;
    if (this.editData.email) payload.email = this.editData.email;
    if (this.editData.telefono) payload.telefono = this.editData.telefono;
    if (this.editData.direccion) payload.direccion = this.editData.direccion;
    if (this.editData.fecha_nacimiento) payload.fecha_nacimiento = this.editData.fecha_nacimiento;

    if (this.editPassword) {
      payload.password = this.editPassword;
    }

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSavingProfile = false;
        this.showEditDialog = false;

        // Actualizar sesión local con los nuevos datos
        this.user = { ...this.user!, ...payload };
        
        // Limpiamos password del local storage por seguridad
        const safeSession = { ...this.user };
        delete (safeSession as any).password;
        localStorage.setItem('session', JSON.stringify(safeSession));
        
        this.messageService.add({ severity: 'success', summary: 'Perfil Actualizado', detail: 'Tus datos se han guardado correctamente' });
        
        // Forzar sincronización de DOM de Angular (elimina el NG0100)
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo actualizar el perfil' });
        this.cdr.detectChanges();
      }
    });
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
