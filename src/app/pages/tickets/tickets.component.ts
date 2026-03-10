import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, USER_LIST } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/permissions';

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: 'abierto' | 'en progreso' | 'cerrado';
  grupo: string;
  asignadoA: string;
}

export const GRUPOS = ['IT', 'Marketing', 'Redes', 'Sistemas', 'Desarrollo', 'Soporte'];

let nextId = 7;

const ALL_TICKETS: Ticket[] = [
  { id: 1, titulo: 'Error en módulo de pagos',       descripcion: 'Los pagos con tarjeta fallan al procesar el cargo. Se requiere revisión urgente del gateway.',          estado: 'abierto',     grupo: 'Desarrollo', asignadoA: 'usuario1' },
  { id: 2, titulo: 'Actualización de base de datos', descripcion: 'Migración de esquema para soporte de nuevas entidades. Incluye scripts de rollback.',                   estado: 'en progreso', grupo: 'IT',         asignadoA: 'usuario1' },
  { id: 3, titulo: 'Fallo en servidor de correo',    descripcion: 'El servicio SMTP no envía notificaciones desde las 14:00. Se investiga la causa en los logs.',          estado: 'abierto',     grupo: 'IT',         asignadoA: 'usuario2' },
  { id: 4, titulo: 'Revisión de permisos de red',    descripcion: 'Auditoría de reglas del firewall y permisos de acceso por segmentos. Tarea completada sin incidentes.', estado: 'cerrado',     grupo: 'Soporte',    asignadoA: 'usuario2' },
  { id: 5, titulo: 'Implementar login SSO',           descripcion: 'Integración con proveedor de identidad corporativo usando SAML 2.0. En fase de pruebas de QA.',        estado: 'en progreso', grupo: 'Desarrollo', asignadoA: 'usuario3' },
  { id: 6, titulo: 'Backup semanal no ejecutado',    descripcion: 'El job programado no corrió el domingo. Se necesita verificar la configuración del scheduler.',         estado: 'abierto',     grupo: 'IT',         asignadoA: 'usuario3' },
];

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent {
  canViewAll   = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_VIEW_ALL));
  canEdit      = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_EDIT));
  canEditState = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_EDIT_STATE));
  canDelete    = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_DELETE));
  canView      = computed(() => this.auth.hasPermission(PERMISSIONS.TICKET_VIEW));

  grupos   = GRUPOS;
  usuarios = USER_LIST;
  estados: Ticket['estado'][] = ['abierto', 'en progreso', 'cerrado'];

  tickets = computed<Ticket[]>(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    if (this.canViewAll()) return ALL_TICKETS;
    return ALL_TICKETS.filter(t => t.asignadoA === user.username);
  });

  ticketsByGroup = computed(() =>
    GRUPOS
      .map(grupo => ({ grupo, tickets: this.tickets().filter(t => t.grupo === grupo) }))
      .filter(g => g.tickets.length > 0)
  );

  editingTicket: Ticket | null = null;
  editEstado: Ticket['estado'] = 'abierto';
  isNewTicket = false;

  constructor(public auth: AuthService) {}

  areaDeUsuario(username: string): string {
    return this.usuarios.find(u => u.username === username)?.area ?? '';
  }

  openCreate() {
    this.isNewTicket = true;
    this.editingTicket = { id: 0, titulo: '', descripcion: '', estado: 'abierto', grupo: GRUPOS[0], asignadoA: '' };
    this.editEstado = 'abierto';
  }

  openEdit(ticket: Ticket) {
    this.isNewTicket = false;
    this.editingTicket = { ...ticket };
    this.editEstado = ticket.estado;
  }

  saveEdit() {
    if (!this.editingTicket) return;

    if (this.isNewTicket) {
      ALL_TICKETS.push({ ...this.editingTicket, id: nextId++, estado: this.editEstado });
    } else {
      const t = ALL_TICKETS.find(t => t.id === this.editingTicket!.id);
      if (t) {
        t.estado = this.editEstado;
        if (this.canEdit()) {
          t.titulo      = this.editingTicket.titulo;
          t.descripcion = this.editingTicket.descripcion;
          t.grupo       = this.editingTicket.grupo;
          t.asignadoA   = this.editingTicket.asignadoA;
        }
      }
    }
    this.editingTicket = null;
  }

  cancelEdit() {
    this.editingTicket = null;
  }

  deleteTicket(id: number) {
    const idx = ALL_TICKETS.findIndex(t => t.id === id);
    if (idx !== -1) ALL_TICKETS.splice(idx, 1);
  }
}
