import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
<<<<<<< HEAD
import { DatePicker } from 'primeng/datepicker';

import { HasPermissionDirective } from '../../directives/has-permission.directive';
=======
import { HasPermissionDirective } from '../../directiva/directiva';
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
import { PermissionService } from '../../services/permission.service';
import { AuthService } from '../../services/auth.service';

export interface GroupItem {
  id: string;
  nivel: string;
  autoridad: string;
  nombre: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
  adminId: string; // user.usuario of the basic admin
  userIds: string[];
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
    CardModule,
    Dialog,
    ButtonModule,
    InputText,
    Textarea,
    Tag,
    Toolbar,
    ConfirmDialog,
    Tooltip,
<<<<<<< HEAD
    DatePicker,

    HasPermissionDirective,
=======
    HasPermissionDirective
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
  ],
  providers: [ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
<<<<<<< HEAD
export class Group {
  private allGroups: GroupItem[] = [
=======
export class Group implements OnInit {
  // Static mock groups
  allGroups: GroupItem[] = [
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
    {
      id: 'group-1',
      nivel: 'Alto',
      autoridad: 'Administrador General',
      nombre: 'Seguridad TI',
      integrantes: 4,
      tickets: 5,
      descripcion: 'Grupo encargado de la seguridad informática y auditorías.',
      adminId: 'admin_carlos',
      userIds: ['normal_user', 'maria_qa', 'pedro_dev']
    },
    {
      id: 'group-2',
      nivel: 'Medio',
      autoridad: 'Coordinador',
      nombre: 'Desarrollo Web',
      integrantes: 4,
      tickets: 10,
      descripcion: 'Equipo de desarrollo de APIs.',
      adminId: 'admin_dev',
      userIds: []
    }
  ];

<<<<<<< HEAD
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

=======
  groups: GroupItem[] = [];
  
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
  showDialog = false;
  editMode = false;
  selectedGroup: GroupItem = this.emptyGroup();

<<<<<<< HEAD
  // ====== Ticket Dialog ======
  showTicketDialog = false;
  ticketEditMode = false;
  selectedTicket: TicketItem = this.emptyTicket();
  currentGroupId = 0;

  // ====== Vistas ======
  viewMode: 'kanban' | 'list' = 'kanban';

  // ====== Filtros rápidos ======
  activeFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
=======
  showMembersDialog = false;
  showWorkspaceDialog = false;
  activeGroupForMembers: GroupItem | null = null;
  newUserIdentifier = '';
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb

  nivelesOptions = [
    { label: 'Alto', value: 'Alto' },
    { label: 'Medio', value: 'Medio' },
    { label: 'Bajo', value: 'Bajo' },
  ];

<<<<<<< HEAD
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
=======
  constructor(
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    const user = this.authService.getUser();
    if (!user) return;

    if (this.permissionService.hasPermission('MANAGE_GROUPS')) {
      // Super admin sees all groups
      this.groups = [...this.allGroups];
    } else if (this.permissionService.hasPermission('VIEW_OWN_GROUP') && user.groupId) {
      // Basic admin or normal user sees only their group
      this.groups = this.allGroups.filter(g => g.id === user.groupId);
    } else {
      this.groups = [];
    }
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
  }

  emptyGroup(): GroupItem {
    return {
      id: '',
      nivel: 'Medio',
      autoridad: '',
      nombre: '',
      integrantes: 0,
      tickets: 0,
      descripcion: '',
      adminId: '',
      userIds: []
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
<<<<<<< HEAD
      const maxId = this.allGroups.reduce((max, g) => Math.max(max, g.id), 0);
      this.selectedGroup.id = maxId + 1;
      this.allGroups = [...this.allGroups, { ...this.selectedGroup }];
=======
      this.selectedGroup.id = 'group-' + (this.allGroups.length + 1);
      this.allGroups.push({ ...this.selectedGroup });
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
    }
    this.loadGroups();
    this.showDialog = false;
  }

  editWorkspace(group: GroupItem): void {
    this.selectedGroup = { ...group };
    this.showWorkspaceDialog = true;
  }

  saveWorkspace(): void {
    const index = this.allGroups.findIndex((g) => g.id === this.selectedGroup.id);
    if (index !== -1) {
      // Basic admin can only edit name and description
      this.allGroups[index].nombre = this.selectedGroup.nombre;
      this.allGroups[index].descripcion = this.selectedGroup.descripcion;
    }
    this.loadGroups();
    this.showWorkspaceDialog = false;
  }

  openManageMembers(group: GroupItem): void {
    this.activeGroupForMembers = group;
    this.newUserIdentifier = '';
    this.showMembersDialog = true;
  }

  addUserToGroup(): void {
    if (!this.activeGroupForMembers || !this.newUserIdentifier.trim()) return;

    // Simulate adding user
    const groupId = this.activeGroupForMembers.id;
    const groupInAll = this.allGroups.find(g => g.id === groupId);
    if (groupInAll) {
      if (!groupInAll.userIds) groupInAll.userIds = [];
      groupInAll.userIds.push(this.newUserIdentifier.trim());
      groupInAll.integrantes = groupInAll.userIds.length + 1; // +1 for basic admin
    }
    
    this.newUserIdentifier = '';
    this.loadGroups();
    this.activeGroupForMembers = this.groups.find(g => g.id === groupId) || null;
  }

  removeUserFromGroup(identifier: string): void {
    if (!this.activeGroupForMembers) return;
    const groupId = this.activeGroupForMembers.id;
    const groupInAll = this.allGroups.find(g => g.id === groupId);
    if (groupInAll) {
      groupInAll.userIds = groupInAll.userIds.filter(id => id !== identifier);
      groupInAll.integrantes = groupInAll.userIds.length + 1;
    }
    this.loadGroups();
    this.activeGroupForMembers = this.groups.find(g => g.id === groupId) || null;
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
<<<<<<< HEAD
=======
        this.loadGroups();
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
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
