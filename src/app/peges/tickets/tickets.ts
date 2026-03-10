import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { HasPermissionDirective } from '../../directiva/directiva';
import { Ticket, TicketStatus, TicketPriority } from '../../models/types';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    HasPermissionDirective
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  
  // Kanban columns
  kanbanColumns: TicketStatus[] = ['Pendiente', 'En progreso', 'Revisión', 'Hecho'];

  showDialog = false;
  showUserDialog = false;
  editMode = false;
  selectedTicket: Ticket = this.emptyTicket();
  
  viewMode: 'kanban' | 'table' = 'kanban';
  newComment = '';
  isCreator = false;
  isAssignee = false;

  activeFilter: 'all' | 'mine' | 'unassigned' | 'high-priority' = 'all';

  // Dropdown options
  estadoOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En progreso', value: 'En progreso' },
    { label: 'Revisión', value: 'Revisión' },
    { label: 'Hecho', value: 'Hecho' }
  ];

  prioridadOptions = [
    { label: 'Crítica', value: 'Crítica' },
    { label: 'Muy Alta', value: 'Muy Alta' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Media', value: 'Media' },
    { label: 'Baja', value: 'Baja' },
    { label: 'Muy Baja', value: 'Muy Baja' },
    { label: 'Trivial', value: 'Trivial' }
  ];

  // Static Ticket DB
  private allTickets: Ticket[] = [
    {
      id: 'TKT-101',
      groupId: 'group-1',
      creadorId: 'admin_carlos',
      titulo: 'Actualizar servidor de base de datos',
      descripcion: 'Aplicar parche de seguridad urgente.',
      estado: 'Pendiente',
      asignadoA: 'normal_user',
      prioridad: 'Crítica',
      fechaCreacion: '2026-03-01',
      fechaLimite: '2026-03-12',
      comentarios: [],
      historialCambios: []
    },
    {
      id: 'TKT-102',
      groupId: 'group-1',
      creadorId: 'admin_carlos',
      titulo: 'Revisar logs de acceso',
      descripcion: 'Auditar los logs de la semana pasada por comportamientos extraños.',
      estado: 'En progreso',
      asignadoA: 'normal_user',
      prioridad: 'Alta',
      fechaCreacion: '2026-03-05',
      fechaLimite: '2026-03-15',
      comentarios: [],
      historialCambios: []
    },
    {
      id: 'TKT-103',
      groupId: 'group-1',
      creadorId: 'super_admin',
      titulo: 'Crear reporte mensual',
      descripcion: 'Reporte de tickets completados.',
      estado: 'Hecho',
      asignadoA: 'normal_user',
      prioridad: 'Media',
      fechaCreacion: '2026-02-28',
      fechaLimite: '2026-03-05',
      comentarios: [],
      historialCambios: []
    }
  ];

  constructor(
    private authService: AuthService,
    public permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    const user = this.authService.getUser();
    if (!user) return;
    
    // Admin sees all in group, User sees only assigned to them
    if (this.permissionService.hasPermission('EDIT_TICKETS_ALL')) {
      this.tickets = this.allTickets.filter(t => t.groupId === user.groupId);
    } else if (this.permissionService.hasPermission('VIEW_OWN_TICKETS')) {
      this.tickets = this.allTickets.filter(t => 
        t.asignadoA === user.usuario || 
        (user.email === 'user@seguridad.com' && t.asignadoA === 'normal_user')
      );
    }
  }

  emptyTicket(): Ticket {
    const user = this.authService?.getUser();
    return {
      id: '',
      groupId: user?.groupId || '',
      creadorId: user?.usuario || '',
      titulo: '',
      descripcion: '',
      estado: 'Pendiente',
      asignadoA: '',
      prioridad: 'Media',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaLimite: '',
      comentarios: [],
      historialCambios: []
    };
  }

  openNew() {
    this.selectedTicket = this.emptyTicket();
    this.editMode = false;
    this.showDialog = true;
  }

  editTicket(t: Ticket) {
    this.selectedTicket = { ...t };
    this.editMode = true;
    this.showDialog = true;
  }

  openModalUser(t: Ticket) {
    if (!this.permissionService.hasPermission('EDIT_TICKET_STATUS')) return;
    this.selectedTicket = { ...t };
    this.newComment = '';
    
    const user = this.authService.getUser();
    this.isCreator = this.selectedTicket.creadorId === user?.usuario;
    this.isAssignee = this.selectedTicket.asignadoA === user?.usuario;
    
    this.showUserDialog = true;
  }

  saveTicket() {
    const user = this.authService.getUser();
    const timestamp = new Date().toLocaleString();

    if (this.showDialog) {
      if (this.editMode) {
        const idx = this.allTickets.findIndex(x => x.id === this.selectedTicket.id);
        if (idx !== -1) {
            this.selectedTicket.historialCambios.push({ id: Math.random().toString(), userId: user?.usuario || '', action: 'Ticket actualizado por Admin', timestamp });
            this.allTickets[idx] = { ...this.selectedTicket };
        }
      } else {
        this.selectedTicket.id = 'TKT-' + (Math.floor(Math.random() * 900) + 100);
        this.selectedTicket.historialCambios.push({ id: Math.random().toString(), userId: user?.usuario || '', action: 'Ticket creado', timestamp });
        this.allTickets.push({ ...this.selectedTicket });
      }
      this.showDialog = false;
    } else if (this.showUserDialog) {
      const idx = this.allTickets.findIndex(x => x.id === this.selectedTicket.id);
      if (idx !== -1) {
          const oldStatus = this.allTickets[idx].estado;
          if (oldStatus !== this.selectedTicket.estado) {
            this.selectedTicket.historialCambios.push({ id: Math.random().toString(), userId: user?.usuario || '', action: `Cambió estado de ${oldStatus} a ${this.selectedTicket.estado}`, timestamp });
          }
          if (this.newComment.trim()) {
            this.selectedTicket.comentarios.push({ id: Math.random().toString(), userId: user?.usuario || '', text: this.newComment.trim(), createdAt: timestamp });
          }
          
          if (this.isCreator && !this.isAssignee) {
             this.selectedTicket.historialCambios.push({ id: Math.random().toString(), userId: user?.usuario || '', action: 'Ticket actualizado por su Creador', timestamp });
          }

          this.allTickets[idx] = { ...this.selectedTicket };
      }
      this.showUserDialog = false;
    }
    this.loadTickets();
  }

  get filteredTickets(): Ticket[] {
    const user = this.authService.getUser();
    let filtered = this.tickets;
    if (this.activeFilter === 'mine') {
      filtered = filtered.filter(t => t.asignadoA === user?.usuario || (user?.email === 'user@seguridad.com' && t.asignadoA === 'normal_user'));
    } else if (this.activeFilter === 'unassigned') {
      filtered = filtered.filter(t => !t.asignadoA || t.asignadoA.trim() === '');
    } else if (this.activeFilter === 'high-priority') {
      filtered = filtered.filter(t => t.prioridad === 'Alta' || t.prioridad === 'Muy Alta' || t.prioridad === 'Crítica');
    }
    return filtered;
  }

  getTicketsByStatus(status: TicketStatus): Ticket[] {
    return this.filteredTickets.filter(t => t.estado === status);
  }

  getStatusSeverity(status: string): any {
    switch (status) {
      case 'Pendiente': return 'warning';
      case 'En progreso': return 'info';
      case 'Revisión': return 'secondary';
      case 'Hecho': return 'success';
      default: return 'info';
    }
  }

  getPrioritySeverity(priority: string): any {
    if (priority === 'Crítica' || priority === 'Muy Alta' || priority === 'Alta') return 'danger';
    if (priority === 'Media') return 'warning';
    return 'success';
  }

  // --- Drag and Drop Logic ---
  draggedTicketId: string | null = null;

  onDragStart(event: DragEvent, ticket: Ticket) {
    this.draggedTicketId = ticket.id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, newStatus: TicketStatus) {
    event.preventDefault();
    if (!this.draggedTicketId) return;
    
    const idx = this.allTickets.findIndex(t => t.id === this.draggedTicketId);
    if (idx !== -1 && this.allTickets[idx].estado !== newStatus) {
      const oldStatus = this.allTickets[idx].estado;
      this.allTickets[idx].estado = newStatus;
      this.allTickets[idx].historialCambios.push({
          id: Math.random().toString(),
          userId: this.authService.getUser()?.usuario || '',
          action: `Movió ticket de ${oldStatus} a ${newStatus} (Drag&Drop)`,
          timestamp: new Date().toLocaleString()
      });
      this.loadTickets();
    }
    this.draggedTicketId = null;
  }
}
