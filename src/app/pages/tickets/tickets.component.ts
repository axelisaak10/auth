import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/permissions';
import { ALL_USERS } from '../../auth/auth.service';

// ── Interfaces ──────────────────────────────────────────────────────────────
export interface TicketComment {
  id: number;
  author: string;
  text: string;
  fecha: Date;
}
export interface HistoryEntry {
  id: number;
  author: string;
  action: string;
  fecha: Date;
}

export type TicketEstado = 'pendiente' | 'en-progreso' | 'revision' | 'hecho' | 'bloqueado';

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: TicketEstado;
  grupo: string;
  asignadoA: string;
  creadoPor: string;
  prioridad: string;
  fechaCreacion: Date;
  fechaLimite: Date | null;
  comentarios: TicketComment[];
  historial: HistoryEntry[];
}

// ── Constants ───────────────────────────────────────────────────────────────
export const PRIORITIES = [
  { value: 'critica',   label: 'Crítica',   color: '#dc2626', bg: '#fef2f2' },
  { value: 'urgente',   label: 'Urgente',   color: '#ea580c', bg: '#fff7ed' },
  { value: 'alta',      label: 'Alta',      color: '#f59e0b', bg: '#fffbeb' },
  { value: 'media',     label: 'Media',     color: '#3b82f6', bg: '#eff6ff' },
  { value: 'baja',      label: 'Baja',      color: '#10b981', bg: '#f0fdf4' },
  { value: 'minima',    label: 'Mínima',    color: '#6b7280', bg: '#f9fafb' },
  { value: 'ninguna',   label: 'Ninguna',   color: '#d1d5db', bg: '#f3f4f6' },
];

export const KANBAN_COLS: { value: TicketEstado; label: string; color: string; icon: string }[] = [
  { value: 'pendiente',   label: 'Pendiente',   color: '#94a3b8', icon: 'pi-circle'       },
  { value: 'en-progreso', label: 'En Progreso', color: '#3b82f6', icon: 'pi-spin pi-spinner' },
  { value: 'revision',    label: 'Revisión',    color: '#f59e0b', icon: 'pi-eye'           },
  { value: 'hecho',       label: 'Hecho',       color: '#10b981', icon: 'pi-check-circle'  },
  { value: 'bloqueado',   label: 'Bloqueado',   color: '#ef4444', icon: 'pi-ban'           },
];

export const GRUPOS = ['IT', 'Marketing', 'Redes', 'Sistemas', 'Desarrollo', 'Soporte'];

let nextId = 7;
let nextCommentId = 1;
let nextHistId    = 20;

export const ALL_TICKETS: Ticket[] = [
  {
    id: 1, titulo: 'Error en módulo de pagos',
    descripcion: 'Los pagos con tarjeta fallan al procesar el cargo. Se requiere revisión urgente del gateway.',
    estado: 'pendiente', grupo: 'Desarrollo', asignadoA: 'usuario1', creadoPor: 'admin',
    prioridad: 'critica', fechaCreacion: new Date('2024-03-01'), fechaLimite: new Date('2024-03-15'),
    comentarios: [{ id: 1, author: 'admin', text: 'Revisión urgente requerida.', fecha: new Date('2024-03-01') }],
    historial: [{ id: 1, author: 'admin', action: 'Ticket creado con estado "pendiente"', fecha: new Date('2024-03-01') }],
  },
  {
    id: 2, titulo: 'Actualización de base de datos',
    descripcion: 'Migración de esquema para soporte de nuevas entidades. Incluye scripts de rollback.',
    estado: 'en-progreso', grupo: 'IT', asignadoA: 'usuario1', creadoPor: 'admin',
    prioridad: 'alta', fechaCreacion: new Date('2024-03-02'), fechaLimite: new Date('2024-03-20'),
    comentarios: [],
    historial: [{ id: 2, author: 'admin', action: 'Ticket creado con estado "pendiente"', fecha: new Date('2024-03-02') },
                { id: 3, author: 'usuario1', action: 'Estado cambiado a "en-progreso"', fecha: new Date('2024-03-03') }],
  },
  {
    id: 3, titulo: 'Fallo en servidor de correo',
    descripcion: 'El servicio SMTP no envía notificaciones desde las 14:00.',
    estado: 'revision', grupo: 'IT', asignadoA: 'usuario2', creadoPor: 'usuario1',
    prioridad: 'urgente', fechaCreacion: new Date('2024-03-03'), fechaLimite: new Date('2024-03-10'),
    comentarios: [],
    historial: [{ id: 4, author: 'usuario1', action: 'Ticket creado', fecha: new Date('2024-03-03') }],
  },
  {
    id: 4, titulo: 'Revisión de permisos de red',
    descripcion: 'Auditoría de reglas del firewall y permisos de acceso.',
    estado: 'hecho', grupo: 'Soporte', asignadoA: 'usuario2', creadoPor: 'admin',
    prioridad: 'media', fechaCreacion: new Date('2024-02-20'), fechaLimite: null,
    comentarios: [],
    historial: [{ id: 5, author: 'admin', action: 'Ticket creado', fecha: new Date('2024-02-20') }],
  },
  {
    id: 5, titulo: 'Implementar login SSO',
    descripcion: 'Integración con proveedor de identidad corporativo usando SAML 2.0.',
    estado: 'en-progreso', grupo: 'Desarrollo', asignadoA: 'usuario3', creadoPor: 'admin',
    prioridad: 'alta', fechaCreacion: new Date('2024-03-05'), fechaLimite: new Date('2024-04-01'),
    comentarios: [],
    historial: [{ id: 6, author: 'admin', action: 'Ticket creado', fecha: new Date('2024-03-05') }],
  },
  {
    id: 6, titulo: 'Backup semanal no ejecutado',
    descripcion: 'El job programado no corrió el domingo.',
    estado: 'bloqueado', grupo: 'IT', asignadoA: 'usuario3', creadoPor: 'admin',
    prioridad: 'baja', fechaCreacion: new Date('2024-03-06'), fechaLimite: null,
    comentarios: [],
    historial: [{ id: 7, author: 'admin', action: 'Ticket creado', fecha: new Date('2024-03-06') }],
  },
];

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent {
  private auth = inject(AuthService);

  canViewAll   = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_VIEW_ALL));
  canEdit      = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_EDIT));
  canEditState = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_EDIT_STATE));
  canDelete    = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_DELETE));
  canAdd       = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_ADD));

  readonly currentUser = this.auth.currentUser;

  // ── View state ─────────────────────────────────────────────────────────────
  viewMode: 'kanban' | 'list' = 'kanban';
  quickFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
  selectedGrupo: string = 'all';

  // ── Drag state ─────────────────────────────────────────────────────────────
  draggingTicket: Ticket | null = null;
  dragOverCol: TicketEstado | null = null;

  // ── Detail / edit panel ────────────────────────────────────────────────────
  detailTicket: Ticket | null = null;
  editingTicket: Ticket | null = null;
  isNewTicket = false;
  newComment = '';

  // ── Static data ────────────────────────────────────────────────────────────
  readonly kanbanCols   = KANBAN_COLS;
  readonly priorities   = PRIORITIES;
  readonly grupos       = GRUPOS;
  readonly todos_usuarios = ALL_USERS;

  // ── Filtered tickets ───────────────────────────────────────────────────────
  filteredTickets = computed<Ticket[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    let base = this.canViewAll() ? [...ALL_TICKETS] : ALL_TICKETS.filter(t => t.asignadoA === user.username);

    if (this.selectedGrupo !== 'all') {
      base = base.filter(t => t.grupo === this.selectedGrupo);
    }

    switch (this.quickFilter) {
      case 'mine':       base = base.filter(t => t.asignadoA === user.username); break;
      case 'unassigned': base = base.filter(t => !t.asignadoA); break;
      case 'high':       base = base.filter(t => ['critica','urgente','alta'].includes(t.prioridad)); break;
    }
    return base;
  });

  ticketsForCol(col: TicketEstado): Ticket[] {
    return this.filteredTickets().filter(t => t.estado === col);
  }

  countByGrupo(grupo: string): number {
    // Count from the base (before group filter) so numbers reflect all visible tickets
    const user = this.auth.currentUser();
    if (!user) return 0;
    let base = this.canViewAll() ? [...ALL_TICKETS] : ALL_TICKETS.filter(t => t.asignadoA === user.username);
    return base.filter(t => t.grupo === grupo).length;
  }

  // ── Priority helpers ───────────────────────────────────────────────────────
  getPriority(value: string) {
    return this.priorities.find(p => p.value === value) ?? this.priorities[6];
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  onDragStart(ticket: Ticket) {
    if (!this.canEditState()) return;
    this.draggingTicket = ticket;
  }

  onDragOver(e: DragEvent, col: TicketEstado) {
    e.preventDefault();
    this.dragOverCol = col;
  }

  onDrop(col: TicketEstado) {
    if (this.draggingTicket && this.draggingTicket.estado !== col) {
      const old = this.draggingTicket.estado;
      this.draggingTicket.estado = col;
      this.addHistory(this.draggingTicket, `Estado cambiado de "${old}" a "${col}"`);
    }
    this.draggingTicket = null;
    this.dragOverCol    = null;
  }

  onDragEnd() {
    this.draggingTicket = null;
    this.dragOverCol    = null;
  }

  // ── Ticket CRUD ────────────────────────────────────────────────────────────
  openCreate() {
    const user = this.currentUser();
    this.isNewTicket  = true;
    this.editingTicket = {
      id: 0, titulo: '', descripcion: '',
      estado: 'pendiente', grupo: GRUPOS[0],
      asignadoA: user?.username ?? '',
      creadoPor: user?.username ?? '',
      prioridad: 'media',
      fechaCreacion: new Date(),
      fechaLimite: null,
      comentarios: [],
      historial: [],
    };
    this.detailTicket = null;
  }

  openDetail(ticket: Ticket) {
    this.detailTicket  = ticket;
    this.editingTicket = null;
    this.newComment    = '';
  }

  openEdit(ticket: Ticket) {
    this.isNewTicket   = false;
    this.editingTicket = { ...ticket, comentarios: [...ticket.comentarios], historial: [...ticket.historial] };
    this.detailTicket  = null;
  }

  saveEdit() {
    if (!this.editingTicket) return;
    const user = this.currentUser()?.username ?? '';

    if (this.isNewTicket) {
      const t: Ticket = { ...this.editingTicket, id: nextId++ };
      this.addHistory(t, `Ticket creado con estado "${t.estado}"`);
      ALL_TICKETS.push(t);
    } else {
      const idx = ALL_TICKETS.findIndex(t => t.id === this.editingTicket!.id);
      if (idx !== -1) {
        const old = ALL_TICKETS[idx];
        if (old.estado !== this.editingTicket.estado) {
          this.addHistory(this.editingTicket, `Estado cambiado de "${old.estado}" a "${this.editingTicket.estado}"`);
        }
        ALL_TICKETS[idx] = { ...this.editingTicket };
      }
    }
    this.editingTicket = null;
  }

  cancelEdit() {
    this.editingTicket = null;
    this.isNewTicket   = false;
  }

  closeDetail() {
    this.detailTicket = null;
  }

  deleteTicket(id: number) {
    const idx = ALL_TICKETS.findIndex(t => t.id === id);
    if (idx !== -1) ALL_TICKETS.splice(idx, 1);
    if (this.detailTicket?.id === id) this.detailTicket = null;
  }

  // ── Comments ───────────────────────────────────────────────────────────────
  addComment(ticket: Ticket) {
    if (!this.newComment.trim()) return;
    const comment: TicketComment = {
      id: nextCommentId++,
      author: this.currentUser()?.username ?? '',
      text: this.newComment.trim(),
      fecha: new Date(),
    };
    ticket.comentarios.push(comment);
    this.addHistory(ticket, `Comentario agregado`);
    this.newComment = '';
  }

  // ── History ────────────────────────────────────────────────────────────────
  private addHistory(ticket: Ticket, action: string) {
    ticket.historial.push({
      id: nextHistId++,
      author: this.currentUser()?.username ?? '',
      action,
      fecha: new Date(),
    });
  }

  // ── Column total for list view sorting ─────────────────────────────────────
  isCreator(ticket: Ticket): boolean {
    return ticket.creadoPor === this.currentUser()?.username;
  }

  isAssigned(ticket: Ticket): boolean {
    return ticket.asignadoA === this.currentUser()?.username;
  }

  setFechaLimite(ticket: Ticket, value: string) {
    ticket.fechaLimite = value ? new Date(value) : null;
  }

  toDateString(d: Date | null): string {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toISOString().substring(0, 10);
  }
}
