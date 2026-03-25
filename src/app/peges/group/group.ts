import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
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
  adminId: string;
  userIds: string[];
}

export interface GroupMember {
  id: string;
  nombre: string;
  email: string;
  grupoId: string;
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
  grupoId: string;
}

@Component({
  selector: 'app-group',
  standalone: true,
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
    DatePicker,
    Select,
    HasPermissionDirective,
  ],
  providers: [ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group implements OnInit {
  private readonly apiUrl = 'http://localhost:3444';

  // Data arrays (loaded from backend)
  allGroups: GroupItem[] = [];
  allTickets: TicketItem[] = [];
  allMembers: GroupMember[] = [];
  isLoading = false;

  // Member dialog
  showAddMemberDialog = false;
  addMemberGroupId: string = '';
  newMemberNombre = '';
  newMemberEmail = '';
  expandedGroupId: string | null = null;

  // Group dialog
  showDialog = false;
  editMode = false;
  selectedGroup: GroupItem = this.emptyGroup();

  // Ticket dialog
  showTicketDialog = false;
  ticketEditMode = false;
  selectedTicket: TicketItem = this.emptyTicket();
  currentGroupId: string = '';

  // View
  viewMode: 'kanban' | 'list' = 'kanban';
  activeFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
  showTicketStatusDialog = false;

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
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Urgente', value: 'Urgente' },
  ];

  constructor(
    private confirmationService: ConfirmationService,
    public ps: PermissionService,
    private authService: AuthService,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.loadGroups();
  }

  // ====== Backend Calls ======
  loadGroups(): void {
    this.isLoading = true;
    this.http.get<GroupItem[]>(`${this.apiUrl}/groups`, { withCredentials: true }).subscribe({
      next: (groups) => {
        this.allGroups = groups;
        this.loadTickets();
        this.loadMembers();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading groups', err);
        this.isLoading = false;
      }
    });
  }

  loadTickets(): void {
    this.http.get<TicketItem[]>(`${this.apiUrl}/tickets`, { withCredentials: true }).subscribe({
      next: (tickets) => { this.allTickets = tickets; },
      error: (err) => console.error('Error loading tickets', err)
    });
  }

  loadMembers(): void {
    this.http.get<GroupMember[]>(`${this.apiUrl}/groups/members`, { withCredentials: true }).subscribe({
      next: (members) => { this.allMembers = members; },
      error: (err) => console.error('Error loading members', err)
    });
  }

  // ====== Group Getters ======
  get groups(): GroupItem[] {
    if (this.ps.hasPermission('group:view')) {
      return this.allGroups;
    }
    const user = this.authService.getUser();
    if (user?.grupoId != null) {
      return this.allGroups.filter(g => g.id === String(user.grupoId));
    }
    return [];
  }

  get currentUserName(): string {
    return this.authService.getUser()?.nombreCompleto ?? '';
  }

  // ====== Group CRUD ======
  emptyGroup(): GroupItem {
    return { id: '', nivel: 'Medio', autoridad: '', nombre: '', integrantes: 0, tickets: 0, descripcion: '', adminId: '', userIds: [] };
  }

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
      this.http.patch(`${this.apiUrl}/groups/${this.selectedGroup.id}`, this.selectedGroup, { withCredentials: true }).subscribe({
        next: () => { this.loadGroups(); this.showDialog = false; },
        error: (err) => console.error('Error updating group', err)
      });
    } else {
      this.http.post<GroupItem>(`${this.apiUrl}/groups`, this.selectedGroup, { withCredentials: true }).subscribe({
        next: () => { this.loadGroups(); this.showDialog = false; },
        error: (err) => console.error('Error creating group', err)
      });
    }
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
        this.http.delete(`${this.apiUrl}/groups/${group.id}`, { withCredentials: true }).subscribe({
          next: () => this.loadGroups(),
          error: (err) => console.error('Error deleting group', err)
        });
      },
    });
  }

  // ====== Ticket CRUD ======
  emptyTicket(): TicketItem {
    return { id: 0, titulo: '', descripcion: '', estado: 'Pendiente', asignadoA: '', creadoPor: this.currentUserName, prioridad: 'Media', fechaCreacion: new Date(), fechaLimite: null, comentarios: '', historialCambios: [], grupoId: '' };
  }

  openNewTicket(groupId: string): void {
    this.selectedTicket = this.emptyTicket();
    this.selectedTicket.grupoId = groupId;
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

  canFullEditTicket(ticket: TicketItem): boolean {
    if (this.ps.hasAnyPermission('ticket:edit')) return true;
    return ticket.creadoPor === this.currentUserName;
  }

  canStatusEditTicket(ticket: TicketItem): boolean {
    return ticket.asignadoA === this.currentUserName && !this.canFullEditTicket(ticket);
  }

  saveTicket(): void {
    if (this.ticketEditMode) {
      this.http.patch(`${this.apiUrl}/tickets/${this.selectedTicket.id}`, this.selectedTicket, { withCredentials: true }).subscribe({
        next: () => { this.loadTickets(); this.showTicketDialog = false; },
        error: (err) => console.error('Error updating ticket', err)
      });
    } else {
      this.http.post<TicketItem>(`${this.apiUrl}/tickets`, this.selectedTicket, { withCredentials: true }).subscribe({
        next: () => { this.loadTickets(); this.showTicketDialog = false; },
        error: (err) => console.error('Error creating ticket', err)
      });
    }
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
        this.http.delete(`${this.apiUrl}/tickets/${ticket.id}`, { withCredentials: true }).subscribe({
          next: () => this.loadTickets(),
          error: (err) => console.error('Error deleting ticket', err)
        });
      },
    });
  }

  getTicketsByGroup(groupId: string): TicketItem[] {
    return this.applyFilter(this.allTickets.filter(t => t.grupoId === groupId));
  }

  getTicketsByGroupAndStatus(groupId: string, estado: string): TicketItem[] {
    return this.applyFilter(this.allTickets.filter(t => t.grupoId === groupId && t.estado === estado));
  }

  setFilter(filter: 'all' | 'mine' | 'unassigned' | 'high'): void {
    this.activeFilter = filter;
  }

  private applyFilter(tickets: TicketItem[]): TicketItem[] {
    switch (this.activeFilter) {
      case 'mine': return tickets.filter(t => t.asignadoA === this.currentUserName);
      case 'unassigned': return tickets.filter(t => !t.asignadoA || t.asignadoA.trim() === '');
      case 'high': return tickets.filter(t => t.prioridad === 'Alta' || t.prioridad === 'Urgente');
      default: return tickets;
    }
  }

  // ====== Ticket Status Dialog ======
  editTicketStatus(ticket: TicketItem): void {
    this.selectedTicket = { ...ticket, historialCambios: [...ticket.historialCambios] };
    this.currentGroupId = ticket.grupoId;
    this.showTicketStatusDialog = true;
  }

  saveTicketStatus(): void {
    this.http.patch(`${this.apiUrl}/tickets/${this.selectedTicket.id}/status`,
      { estado: this.selectedTicket.estado, comentarios: this.selectedTicket.comentarios },
      { withCredentials: true }
    ).subscribe({
      next: () => { this.loadTickets(); this.showTicketStatusDialog = false; },
      error: (err) => console.error('Error updating ticket status', err)
    });
  }

  // ====== Members ======
  getMembersByGroup(groupId: string): GroupMember[] {
    return this.allMembers.filter(m => m.grupoId === groupId);
  }

  openAddMember(groupId: string): void {
    this.addMemberGroupId = groupId;
    this.newMemberNombre = '';
    this.newMemberEmail = '';
    this.showAddMemberDialog = true;
  }

  addMember(): void {
    if (!this.newMemberNombre.trim() && !this.newMemberEmail.trim()) return;
    const payload = { nombre: this.newMemberNombre.trim(), email: this.newMemberEmail.trim(), grupoId: this.addMemberGroupId };
    this.http.post(`${this.apiUrl}/groups/${this.addMemberGroupId}/members`, payload, { withCredentials: true }).subscribe({
      next: () => { this.loadMembers(); this.loadGroups(); this.showAddMemberDialog = false; },
      error: (err) => console.error('Error adding member', err)
    });
  }

  removeMember(member: GroupMember, groupId: string): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar a "${member.nombre}" del grupo?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${this.apiUrl}/groups/${groupId}/members/${member.id}`, { withCredentials: true }).subscribe({
          next: () => { this.loadMembers(); this.loadGroups(); },
          error: (err) => console.error('Error removing member', err)
        });
      },
    });
  }

  toggleMembers(groupId: string): void {
    this.expandedGroupId = this.expandedGroupId === groupId ? null : groupId;
  }

  getGroupName(groupId: string): string {
    return this.allGroups.find(g => g.id === groupId)?.nombre ?? '';
  }

  // ====== Helpers ======
  getNivelSeverity(nivel: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (nivel) {
      case 'Alto': return 'danger';
      case 'Medio': return 'warn';
      case 'Bajo': return 'success';
      default: return 'info';
    }
  }

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
      case 'Alta': return 'warn';
      case 'Media': return 'info';
      case 'Baja':
      case 'Mínima': return 'success';
      default: return 'info';
    }
  }

  get totalIntegrantes(): number {
    return this.groups.reduce((sum, g) => sum + g.integrantes, 0);
  }

  get totalTickets(): number {
    return this.groups.reduce((sum, g) => sum + g.tickets, 0);
  }

  get hasGroupActions(): boolean {
    return this.ps.hasAnyPermission('group:edit', 'group:delete', 'user:add', 'user:delete', 'ticket:add');
  }

  get isStatusOnlyEdit(): boolean {
    return this.ps.hasPermission('ticket:edit:state') && !this.ps.hasAnyPermission('ticket:edit');
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
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  onDrop(event: DragEvent, nuevoEstado: string): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    if (!this.draggedTicket || this.draggedTicket.estado === nuevoEstado) {
      this.draggedTicket = null;
      return;
    }
    // Update via backend
    this.http.patch(`${this.apiUrl}/tickets/${this.draggedTicket.id}/status`,
      { estado: nuevoEstado },
      { withCredentials: true }
    ).subscribe({
      next: () => this.loadTickets(),
      error: (err) => console.error('Error updating ticket status via drag', err)
    });
    this.draggedTicket = null;
  }
}
