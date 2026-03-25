import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { DatePicker } from 'primeng/datepicker';

import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { PermissionService } from '../../services/permission.service';
import { AuthService } from '../../services/auth.service';

export interface GroupItem {
  id: number;
  nivel: string;
  autoridad: string;
  nombre: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
}

export interface GroupMember {
  id: number;
  nombre: string;
  email: string;
  grupoId: number;
}

export interface TicketItem {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  asignadoA: string;
  creadoPor: string;
  prioridad: string;
  fechaCreacion: Date;
  fechaLimite: Date | null;
  comentarios: string;
  historialCambios: string[];
  grupoId: number;
}

@Component({
  selector: 'app-group',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Dialog,
    ButtonModule,
    InputText,
    Textarea,
    Tag,
    Toolbar,
    InputNumber,
    Select,
    ConfirmDialog,
    Tooltip,
    DatePicker,

    HasPermissionDirective,
  ],
  providers: [ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group {
  private allGroups: GroupItem[] = [
    {
      id: 1,
      nivel: 'Alto',
      autoridad: 'Administrador General',
      nombre: 'Seguridad TI',
      integrantes: 8,
      tickets: 14,
      descripcion: 'Grupo encargado de la seguridad informática y auditorías.',
    },
    {
      id: 2,
      nivel: 'Medio',
      autoridad: 'Coordinador',
      nombre: 'Desarrollo Web',
      integrantes: 12,
      tickets: 27,
      descripcion: 'Equipo de desarrollo de aplicaciones web y APIs.',
    },
    {
      id: 3,
      nivel: 'Bajo',
      autoridad: 'Supervisor',
      nombre: 'Soporte Técnico',
      integrantes: 5,
      tickets: 42,
      descripcion: 'Atención y resolución de incidencias técnicas.',
    },
    {
      id: 4,
      nivel: 'Alto',
      autoridad: 'Director',
      nombre: 'Infraestructura',
      integrantes: 6,
      tickets: 9,
      descripcion: 'Gestión de servidores, redes y servicios cloud.',
    },
    {
      id: 5,
      nivel: 'Medio',
      autoridad: 'Líder de Proyecto',
      nombre: 'QA & Testing',
      integrantes: 4,
      tickets: 18,
      descripcion: 'Pruebas de calidad y aseguramiento de software.',
    },
  ];

  // ====== Tickets ======
  allTickets: TicketItem[] = [
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
    {
      id: 3,
      titulo: 'Revisar permisos de acceso',
      descripcion: 'Verificar los permisos RBAC del módulo principal.',
      estado: 'Bloqueado',
      asignadoA: 'María López',
      creadoPor: 'Carlos Administrador',
      prioridad: 'Media',
      fechaCreacion: new Date('2026-03-05'),
      fechaLimite: new Date('2026-03-20'),
      comentarios: 'Esperando aprobación de seguridad.',
      historialCambios: ['Creado el 05/03/2026'],
      grupoId: 1,
    },
  ];

  // ====== Miembros del grupo ======
  allMembers: GroupMember[] = [
    { id: 1, nombre: 'Carlos Administrador', email: 'admin@seguridad.com', grupoId: 1 },
    { id: 2, nombre: 'María López', email: 'maria@seguridad.com', grupoId: 1 },
    { id: 3, nombre: 'Juan Pérez', email: 'juan@seguridad.com', grupoId: 2 },
    { id: 4, nombre: 'Ana García', email: 'ana@seguridad.com', grupoId: 2 },
    { id: 5, nombre: 'Pedro Sánchez', email: 'pedro@seguridad.com', grupoId: 3 },
    { id: 6, nombre: 'Laura Martínez', email: 'laura@seguridad.com', grupoId: 4 },
    { id: 7, nombre: 'Roberto Díaz', email: 'roberto@seguridad.com', grupoId: 5 },
  ];

  showAddMemberDialog = false;
  addMemberGroupId = 0;
  newMemberNombre = '';
  newMemberEmail = '';
  expandedGroupId: number | null = null;

  showDialog = false;
  editMode = false;
  selectedGroup: GroupItem = this.emptyGroup();

  // ====== Ticket Dialog ======
  showTicketDialog = false;
  ticketEditMode = false;
  selectedTicket: TicketItem = this.emptyTicket();
  currentGroupId = 0;

  // ====== Vistas ======
  viewMode: 'kanban' | 'list' = 'kanban';

  // ====== Filtros rápidos ======
  activeFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';

  nivelesOptions = [
    { label: 'Alto', value: 'Alto' },
    { label: 'Medio', value: 'Medio' },
    { label: 'Bajo', value: 'Bajo' },
  ];

  estadoOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En progreso', value: 'En progreso' },
    { label: 'Revisión', value: 'Revisión' },
    { label: 'Bloqueado', value: 'Bloqueado' },
    { label: 'Finalizado', value: 'Finalizado' },
  ];

  prioridadOptions = [
    { label: 'Mínima', value: 'Mínima' },
    { label: 'Baja', value: 'Baja' },
    { label: 'Media-Baja', value: 'Media-Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Media-Alta', value: 'Media-Alta' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Urgente', value: 'Urgente' },
  ];

  // LLM Model Display
  llmModel = 'GPT-4o';

  constructor(
    private confirmationService: ConfirmationService,
    public ps: PermissionService,
    private authService: AuthService,
  ) { }

  /**
   * Si el usuario tiene group:view (admin) → ve todos los grupos.
   * Si solo tiene group:view (usuario normal) → ve solo SU grupo (por grupoId).
   */
  get groups(): GroupItem[] {
    if (this.ps.hasPermission('group:view')) {
      return this.allGroups;
    }
    const user = this.authService.getUser();
    if (user?.grupoId != null) {
      return this.allGroups.filter(g => g.id === user.grupoId);
    }
    return [];
  }

  get currentUserName(): string {
    return this.authService.getUser()?.nombreCompleto ?? '';
  }

  emptyGroup(): GroupItem {
    return {
      id: 0,
      nivel: 'Medio',
      autoridad: '',
      nombre: '',
      integrantes: 0,
      tickets: 0,
      descripcion: '',
    };
  }

  emptyTicket(): TicketItem {
    return {
      id: 0,
      titulo: '',
      descripcion: '',
      estado: 'Pendiente',
      asignadoA: '',
      creadoPor: this.currentUserName,
      prioridad: 'Media',
      fechaCreacion: new Date(),
      fechaLimite: null,
      comentarios: '',
      historialCambios: [],
      grupoId: 0,
    };
  }

  // ====== Group CRUD ======
  openNew(): void {
    this.selectedGroup = this.emptyGroup();
    this.editMode = false;
    this.showDialog = true;
  }

  editGroup(group: GroupItem): void {
    this.selectedGroup = { ...group };
    this.editMode = true;
    this.showDialog = true;
  }

  saveGroup(): void {
    if (this.editMode) {
      const index = this.allGroups.findIndex((g) => g.id === this.selectedGroup.id);
      if (index !== -1) {
        this.allGroups[index] = { ...this.selectedGroup };
      }
    } else {
      const maxId = this.allGroups.reduce((max, g) => Math.max(max, g.id), 0);
      this.selectedGroup.id = maxId + 1;
      this.allGroups = [...this.allGroups, { ...this.selectedGroup }];
    }
    this.showDialog = false;
  }

  deleteGroup(group: GroupItem): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el grupo "${group.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.allGroups = this.allGroups.filter((g) => g.id !== group.id);
      },
    });
  }

  // ====== Ticket CRUD ======
  openNewTicket(groupId: number): void {
    this.selectedTicket = this.emptyTicket();
    this.selectedTicket.grupoId = groupId;
    this.selectedTicket.fechaCreacion = new Date();
    this.selectedTicket.creadoPor = this.currentUserName;
    this.currentGroupId = groupId;
    this.ticketEditMode = false;
    this.showTicketDialog = true;
  }

  editTicket(ticket: TicketItem): void {
    this.selectedTicket = { ...ticket, historialCambios: [...ticket.historialCambios] };
    this.currentGroupId = ticket.grupoId;
    this.ticketEditMode = true;
    this.showTicketDialog = true;
  }

  /** ¿El usuario actual puede editar todos los campos del ticket? (es creador o tiene permiso admin) */
  canFullEditTicket(ticket: TicketItem): boolean {
    if (this.ps.hasAnyPermission('ticket:edit', 'ticket:edit')) return true;
    return ticket.creadoPor === this.currentUserName;
  }

  /** ¿El usuario actual puede cambiar solo estado y comentarios? (es asignado) */
  canStatusEditTicket(ticket: TicketItem): boolean {
    return ticket.asignadoA === this.currentUserName && !this.canFullEditTicket(ticket);
  }

  saveTicket(): void {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (this.ticketEditMode) {
      const index = this.allTickets.findIndex((t) => t.id === this.selectedTicket.id);
      if (index !== -1) {
        this.selectedTicket.historialCambios.push(`Editado el ${dateStr}`);
        this.allTickets[index] = { ...this.selectedTicket };
      }
    } else {
      const maxId = this.allTickets.reduce((max, t) => Math.max(max, t.id), 0);
      this.selectedTicket.id = maxId + 1;
      this.selectedTicket.historialCambios = [`Creado el ${dateStr}`];
      this.allTickets = [...this.allTickets, { ...this.selectedTicket }];
    }
    this.showTicketDialog = false;
  }

  deleteTicket(ticket: TicketItem): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el ticket "${ticket.titulo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.allTickets = this.allTickets.filter((t) => t.id !== ticket.id);
      },
    });
  }

  getTicketsByGroup(groupId: number): TicketItem[] {
    const tickets = this.allTickets.filter(t => t.grupoId === groupId);
    return this.applyFilter(tickets);
  }

  getTicketsByGroupAndStatus(groupId: number, estado: string): TicketItem[] {
    const tickets = this.allTickets.filter(t => t.grupoId === groupId && t.estado === estado);
    return this.applyFilter(tickets);
  }

  // ====== Filtros Rápidos ======
  setFilter(filter: 'all' | 'mine' | 'unassigned' | 'high'): void {
    this.activeFilter = filter;
  }

  private applyFilter(tickets: TicketItem[]): TicketItem[] {
    switch (this.activeFilter) {
      case 'mine':
        return tickets.filter(t => t.asignadoA === this.currentUserName);
      case 'unassigned':
        return tickets.filter(t => !t.asignadoA || t.asignadoA.trim() === '');
      case 'high':
        return tickets.filter(t => t.prioridad === 'Alta' || t.prioridad === 'Urgente');
      default:
        return tickets;
    }
  }

  // ====== Members ======
  getMembersByGroup(groupId: number): GroupMember[] {
    return this.allMembers.filter(m => m.grupoId === groupId);
  }

  openAddMember(groupId: number): void {
    this.addMemberGroupId = groupId;
    this.newMemberNombre = '';
    this.newMemberEmail = '';
    this.showAddMemberDialog = true;
  }

  addMember(): void {
    if (!this.newMemberNombre.trim() && !this.newMemberEmail.trim()) return;
    const maxId = this.allMembers.reduce((max, m) => Math.max(max, m.id), 0);
    const nuevo: GroupMember = {
      id: maxId + 1,
      nombre: this.newMemberNombre.trim() || 'Sin nombre',
      email: this.newMemberEmail.trim() || 'sin-email@correo.com',
      grupoId: this.addMemberGroupId,
    };
    this.allMembers = [...this.allMembers, nuevo];
    // Update integrantes count
    const group = this.allGroups.find(g => g.id === this.addMemberGroupId);
    if (group) group.integrantes = this.getMembersByGroup(this.addMemberGroupId).length;
    this.newMemberNombre = '';
    this.newMemberEmail = '';
    this.showAddMemberDialog = false;
  }

  removeMember(member: GroupMember, groupId: number): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar a "${member.nombre}" del grupo?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.allMembers = this.allMembers.filter(m => m.id !== member.id);
        const group = this.allGroups.find(g => g.id === groupId);
        if (group) group.integrantes = this.getMembersByGroup(groupId).length;
      },
    });
  }

  toggleMembers(groupId: number): void {
    this.expandedGroupId = this.expandedGroupId === groupId ? null : groupId;
  }

  getGroupName(groupId: number): string {
    return this.allGroups.find(g => g.id === groupId)?.nombre ?? '';
  }

  // ====== Helpers ======
  getNivelSeverity(nivel: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (nivel) {
      case 'Alto':
        return 'danger';
      case 'Medio':
        return 'warn';
      case 'Bajo':
        return 'success';
      default:
        return 'info';
    }
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

  get totalIntegrantes(): number {
    return this.groups.reduce((sum, g) => sum + g.integrantes, 0);
  }

  get totalTickets(): number {
    return this.groups.reduce((sum, g) => sum + g.tickets, 0);
  }

  /** ¿El usuario tiene alguna acción de grupo? (editar, eliminar, agregar personas, crear tickets) */
  get hasGroupActions(): boolean {
    return this.ps.hasAnyPermission(
      'group:edit', 'group:edit',
      'group:delete', 'group:delete',
      'user:add', 'user:delete',
      'ticket:add', 'ticket:add',
    );
  }

  /** ¿El usuario solo puede editar el estado del ticket? (no edición completa) */
  get isStatusOnlyEdit(): boolean {
    return this.ps.hasPermission('ticket:edit:state')
      && !this.ps.hasAnyPermission('ticket:edit', 'ticket:edit');
  }

  // ====== Ticket Status-Only Edit (para usuario normal en group page) ======
  showTicketStatusDialog = false;

  editTicketStatus(ticket: TicketItem): void {
    this.selectedTicket = { ...ticket, historialCambios: [...ticket.historialCambios] };
    this.currentGroupId = ticket.grupoId;
    this.showTicketStatusDialog = true;
  }

  saveTicketStatus(): void {
    const index = this.allTickets.findIndex(t => t.id === this.selectedTicket.id);
    if (index !== -1) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      this.selectedTicket.historialCambios.push(`Estado cambiado a "${this.selectedTicket.estado}" el ${dateStr}`);
      this.allTickets[index] = { ...this.selectedTicket };
    }
    this.showTicketStatusDialog = false;
  }

  // ====== Drag & Drop Kanban ======
  private draggedTicket: TicketItem | null = null;

  onDragStart(event: DragEvent, ticket: TicketItem): void {
    this.draggedTicket = ticket;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(ticket.id));
    }
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragEnd(event: DragEvent): void {
    (event.target as HTMLElement).classList.remove('dragging');
    this.draggedTicket = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    const target = (event.currentTarget as HTMLElement);
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    const target = (event.currentTarget as HTMLElement);
    target.classList.remove('drag-over');
  }

  onDrop(event: DragEvent, nuevoEstado: string): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');

    if (!this.draggedTicket || this.draggedTicket.estado === nuevoEstado) {
      this.draggedTicket = null;
      return;
    }

    const index = this.allTickets.findIndex(t => t.id === this.draggedTicket!.id);
    if (index !== -1) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const ticket = { ...this.allTickets[index] };
      ticket.historialCambios = [...ticket.historialCambios, `Estado cambiado a "${nuevoEstado}" el ${dateStr}`];
      ticket.estado = nuevoEstado;
      this.allTickets[index] = ticket;
    }
    this.draggedTicket = null;
  }
}
