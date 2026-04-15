import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { DatePicker } from 'primeng/datepicker';
import { Select as PSelect } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { EditorModule } from 'primeng/editor';

import { PermissionService } from '../../services/permission.service';
import { AuthService } from '../../services/auth.service';

export interface TicketItem {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  estadoId: string;
  prioridad: string;
  prioridadId: string;
  asignadoA: string;
  asignadoId: string;
  creadoPor: string;
  fechaCreacion: Date;
  fechaLimite: Date | null;
  fechaFinal: Date | null;
  comentarios: string;
  historialCambios: string[];
  grupoId: string;
}

export interface GroupItem {
  id: string;
  nombre: string;
  esCreador?: boolean;
  esMiembro?: boolean;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, CardModule, Dialog, ButtonModule,
    InputText, Textarea, Tag, ConfirmDialog, Tooltip, DatePicker,
    PSelect, Toast, TabsModule, TimelineModule, AvatarModule, EditorModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit, OnDestroy {
  private readonly apiUrl = environment.apiGateway;

  allGroups: GroupItem[] = [];
  allTickets: TicketItem[] = [];
  groupMembers: any[] = [];
  
  selectedGroupId: string | null = null;
  today = new Date();

  // Dialogs
  showTicketDialog = false;
  ticketEditMode = false;
  selectedTicket!: TicketItem;

  showTicketDetailsDialog = false;
  selectedTicketDetails: TicketItem | null = null;
  ticketComments: any[] = [];
  ticketHistory: any[] = [];
  newCommentText: string = '';
  isDetailsLoading = false;
  showTicketStatusDialog = false;

  estadoOptions: { label: string; value: string }[] = [];
  prioridadOptions: { label: string; value: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    public ps: PermissionService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.selectedTicket = this.emptyTicket();
  }

  ngOnInit(): void {
    // Despertar el servicio de tikets en Render
    this.http.get(`${this.apiUrl}/tickets/ping`, { withCredentials: true }).subscribe({ error: () => {} });

    // 1. Obtener estados y prioridades
    this.loadEstados();
    this.loadPrioridades();

    // 2. Cargar grupos (para el dropdown).
    this.loadGroups(() => {
      // 3. Revisar si la ruta traía un groupId específico
      this.route.paramMap.subscribe(params => {
        const routeGroupId = params.get('groupId');
        if (routeGroupId && this.allGroups.some(g => g.id === routeGroupId)) {
          this.selectedGroupId = routeGroupId;
        } else if (this.allGroups.length > 0 && !this.selectedGroupId) {
          // Si no hay parámetro, auto-seleccionar el primer grupo
          this.selectedGroupId = this.allGroups[0].id;
        }
        
        if (this.selectedGroupId) {
          this.loadTickets();
          this.loadGroupMembers(this.selectedGroupId);
        }
        this.cdr.markForCheck();
      });
    });

    // Subscribirse a eventos de tickets SSE
    this.authService.registerTicketCallback(this.onTicketEvent);
  }

  ngOnDestroy(): void {
    this.authService.unregisterTicketCallback(this.onTicketEvent);
  }

  private onTicketEvent = (type: string, data: any) => {
    if (this.selectedGroupId) {
      this.loadTickets();
    }
  };

  get currentUserId(): string {
    const user = this.authService.getUser() as any;
    return user?.sub || user?.id || '';
  }

  get currentUserName(): string {
    const user = this.authService.getUser() as any;
    return user?.nombre_completo || user?.nombreCompleto || '';
  }

  get currentGroupTickets(): TicketItem[] {
    return this.allTickets.filter(t => t.grupoId === this.selectedGroupId);
  }

  onGroupChange(): void {
    if (this.selectedGroupId) {
      // Actualizar la URL de forma silenciosa para que se pueda compartir
      this.router.navigate(['/home/tickets', this.selectedGroupId], { replaceUrl: true });
      this.loadTickets();
      this.loadGroupMembers(this.selectedGroupId);
    }
  }

  // ============== DATA LOADING ============== //
  loadGroups(callback?: () => void): void {
    this.http.get<any>(`${this.apiUrl}/groups`, { withCredentials: true }).subscribe({
      next: (res) => {
        const raw = res?.data?.data || res?.data || [];
        this.allGroups = raw.map((g: any) => ({
          id: g.id,
          nombre: g.nombre,
          esCreador: g.creador_id === this.currentUserId,
          esMiembro: g.es_miembro
        }));
        if (callback) callback();
      },
      error: () => {
        this.allGroups = [];
        if (callback) callback();
      }
    });
  }

  loadTickets(): void {
    if (!this.selectedGroupId) return;
    this.http.get<any>(`${this.apiUrl}/tickets?limit=500`, { withCredentials: true }).subscribe({
      next: (res) => {
        const raw = res?.data?.data || res?.data || [];
        this.allTickets = raw.map((t: any) => this.mapBackendTicket(t));
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loadTickets', err)
    });
  }

  loadGroupMembers(groupId: string): void {
    this.http.get<any>(`${this.apiUrl}/groups/${groupId}/members`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.groupMembers = Array.isArray(res.data) ? res.data : [];
        this.cdr.markForCheck();
      }
    });
  }

  loadEstados(): void {
    this.http.get<any>(`${this.apiUrl}/tickets/estados`, { withCredentials: true }).subscribe({
      next: (res) => {
        const data = res?.data?.data || res?.data || [];
        this.estadoOptions = data.map((e: any) => ({ label: e.nombre, value: e.id })).sort((a: any, b: any) => a.value.localeCompare(b.value));
        this.cdr.detectChanges();
      }
    });
  }

  loadPrioridades(): void {
    this.http.get<any>(`${this.apiUrl}/tickets/prioridades`, { withCredentials: true }).subscribe({
      next: (res) => {
        const data = res?.data?.data || res?.data || [];
        this.prioridadOptions = data.map((p: any) => ({ label: p.nombre, value: p.id })).sort((a: any, b: any) => b.label.localeCompare(a.label));
        this.cdr.detectChanges();
      }
    });
  }

  // ============== TICKET MAPPING ============== //
  private mapBackendTicket(t: any): TicketItem {
    return {
      id: t.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      estado: t.estado?.nombre || 'Desconocido',
      estadoId: t.estado_id,
      prioridad: t.prioridad?.nombre || 'Desconocida',
      prioridadId: t.prioridad_id,
      asignadoA: t.asignado?.nombre_completo || '',
      asignadoId: t.asignado_id || '',
      creadoPor: t.autor?.nombre_completo || 'Sistema',
      fechaCreacion: new Date(t.creado_en),
      fechaLimite: t.fecha_final ? new Date(t.fecha_final) : null,
      fechaFinal: null,
      comentarios: '',
      historialCambios: [],
      grupoId: t.grupo_id,
    };
  }

  emptyTicket(): TicketItem {
    return {
      id: '',
      titulo: '',
      descripcion: '',
      estado: '',
      estadoId: '',
      prioridad: '',
      prioridadId: '',
      asignadoA: '',
      asignadoId: '',
      creadoPor: this.currentUserName,
      fechaCreacion: new Date(),
      fechaLimite: null,
      fechaFinal: null,
      comentarios: '',
      historialCambios: [],
      grupoId: this.selectedGroupId || '',
    };
  }

  // ============== KANBAN GETTERS ============== //
  getGroupTicketsByStatus(statusId: string): TicketItem[] {
    return this.currentGroupTickets.filter(t => t.estadoId === statusId);
  }

  getPrioridadSeverity(prioridad: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const l = prioridad.toLowerCase();
    if (l.includes('urgente')) return 'danger';
    if (l.includes('alta')) return 'warn';
    if (l.includes('media')) return 'info';
    if (l.includes('baja') || l.includes('mínima')) return 'success';
    return 'secondary';
  }

  // ============== PERMISSIONS ============== //
  isCreatorOfGroup(groupId: string): boolean {
    const group = this.allGroups.find(g => g.id === groupId);
    return !!group?.esCreador;
  }

  isAdmin(): boolean {
    return this.ps.hasAnyPermission('superadmin');
  }

  /** Solo el asignado puede mover; admins y creadores del grupo también */
  canMoveTicket(ticket: TicketItem): boolean {
    if (this.isAdmin() || this.isCreatorOfGroup(ticket.grupoId)) return true;
    return ticket.asignadoId === this.currentUserId;
  }

  canFullEditTicketInGroup(ticket: TicketItem): boolean {
    return this.ps.hasAnyPermission('ticket:edit', 'superadmin') ||
           this.isCreatorOfGroup(ticket.grupoId);
  }

  canDeleteTicket(): boolean {
    return this.ps.hasAnyPermission('ticket:delete', 'superadmin') ||
           (this.selectedGroupId ? this.isCreatorOfGroup(this.selectedGroupId) : false);
  }

  getMoveTooltip(ticket: TicketItem): string {
    if (this.canMoveTicket(ticket)) return 'Arrastra para cambiar estado';
    if (!ticket.asignadoId) return 'Ticket sin asignar — solo un admin puede moverlo';
    return `Solo ${ticket.asignadoA} puede mover este ticket`;
  }

  // ============== DRAG & DROP ============== //
  draggedTicket: TicketItem | null = null;
  onDragStart(event: DragEvent, ticket: TicketItem) {
    this.draggedTicket = ticket;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    (event.target as HTMLElement).classList.add('dragging');
  }
  onDragEnd(event: DragEvent) {
    this.draggedTicket = null;
    (event.target as HTMLElement).classList.remove('dragging');
    document.querySelectorAll('.kanban-column-body.drop-target').forEach(el => el.classList.remove('drop-target'));
  }
  onDragOver(event: DragEvent) {
    if (this.draggedTicket && this.canMoveTicket(this.draggedTicket)) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    }
  }
  onDragEnter(event: DragEvent) {
    if (this.draggedTicket && this.canMoveTicket(this.draggedTicket)) {
      event.preventDefault();
      const target = event.currentTarget as HTMLElement;
      if (target.classList.contains('kanban-column-body')) target.classList.add('drop-target');
    }
  }
  onDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    if (target.classList.contains('kanban-column-body')) target.classList.remove('drop-target');
  }
  onDrop(event: DragEvent, newStatusId: string) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    if (target.classList.contains('kanban-column-body')) target.classList.remove('drop-target');
    if (this.draggedTicket && this.draggedTicket.estadoId !== newStatusId && this.canMoveTicket(this.draggedTicket)) {
      this.updateTicketStatus(this.draggedTicket, newStatusId);
    }
  }

  // ============== ACTIONS ============== //
  openNewTicket(): void {
    if (!this.selectedGroupId) return;
    this.selectedTicket = this.emptyTicket();
    this.ticketEditMode = false;
    
    if (this.estadoOptions.length > 0) {
      this.selectedTicket.estadoId = this.estadoOptions[0].value;
      this.selectedTicket.estado = this.estadoOptions[0].label;
    }
    if (this.prioridadOptions.length > 0) {
      // Select the 2nd (media) if exists, else 1st
      const i = this.prioridadOptions.length > 1 ? 1 : 0;
      this.selectedTicket.prioridadId = this.prioridadOptions[i].value;
      this.selectedTicket.prioridad = this.prioridadOptions[i].label;
    }
    this.showTicketDialog = true;
  }

  editTicket(ticket: TicketItem): void {
    this.selectedTicket = { ...ticket };
    this.ticketEditMode = true;
    this.showTicketDialog = true;
  }

  saveTicket(): void {
    const postPayload = {
      titulo: this.selectedTicket.titulo,
      descripcion: this.selectedTicket.descripcion || undefined,
      prioridad_id: this.selectedTicket.prioridadId,
      estado_id: this.selectedTicket.estadoId,
      asignado_id: this.selectedTicket.asignadoId || undefined,
      fecha_final: this.selectedTicket.fechaLimite ? new Date(this.selectedTicket.fechaLimite).toISOString() : null,
      grupo_id: this.selectedTicket.grupoId
    };

    const putPayload = {
      titulo: this.selectedTicket.titulo,
      descripcion: this.selectedTicket.descripcion || undefined,
      asignado_id: this.selectedTicket.asignadoId || undefined,
      fecha_final: this.selectedTicket.fechaLimite ? new Date(this.selectedTicket.fechaLimite).toISOString() : null,
    };

    if (this.ticketEditMode) {
      this.http.put(`${this.apiUrl}/tickets/${this.selectedTicket.id}`, putPayload, { withCredentials: true }).subscribe({
        next: () => {
          this.loadTickets();
          this.showTicketDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket actualizado' });
        },
        error: err => console.error('Error', err)
      });
    } else {
      this.http.post(`${this.apiUrl}/tickets`, postPayload, { withCredentials: true }).subscribe({
        next: () => {
          this.loadTickets();
          this.showTicketDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket creado' });
        },
        error: err => console.error('Error', err)
      });
    }
  }

  updateTicketStatus(ticket: TicketItem, newStatusId: string): void {
    this.http.put(`${this.apiUrl}/tickets/${ticket.id}/estado`, { estado_id: newStatusId }, { withCredentials: true }).subscribe({
      next: () => {
        this.loadTickets();
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `Se movió el ticket` });
      },
      error: err => console.error("Error updating ticket status", err)
    });
  }

  deleteTicket(ticket: TicketItem): void {
    this.confirmationService.confirm({
      message: `¿Eliminar ticket "${ticket.titulo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${this.apiUrl}/tickets/${ticket.id}`, { withCredentials: true }).subscribe({
          next: () => {
            this.loadTickets();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket eliminado' });
          }
        });
      }
    });
  }

  // ============== COMMENTS & DETAILS ============== //
  openTicketDetails(ticket: TicketItem): void {
    this.selectedTicketDetails = ticket;
    this.showTicketDetailsDialog = true;
    this.newCommentText = '';
    this.loadTicketHistory(ticket.id);
    this.loadTicketComments(ticket.id);
  }

  loadTicketHistory(ticketId: string): void {
    this.isDetailsLoading = true;
    this.http.get<any>(`${this.apiUrl}/tickets/${ticketId}/historial`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.ticketHistory = res?.data || [];
        this.isDetailsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => this.isDetailsLoading = false
    });
  }

  loadTicketComments(ticketId: string): void {
    this.http.get<any>(`${this.apiUrl}/comentarios?ticket_id=${ticketId}`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.ticketComments = (res?.data?.data || res?.data || []).reverse();
        this.cdr.markForCheck();
      }
    });
  }

  addComment(): void {
    if (!this.newCommentText.trim() || !this.selectedTicketDetails) return;
    const body = {
      contenido: this.newCommentText,
      ticket_id: this.selectedTicketDetails.id,
      es_interno: false
    };
    this.http.post(`${this.apiUrl}/comentarios`, body, { withCredentials: true }).subscribe({
      next: () => {
        this.newCommentText = '';
        this.loadTicketComments(this.selectedTicketDetails!.id);
      }
    });
  }
}
