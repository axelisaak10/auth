import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { EditorModule } from 'primeng/editor';

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
  esMiembro?: boolean;
  esCreador?: boolean;
  permisosLocales?: string[];
}

export interface GroupMember {
  id: string;
  nombre: string;
  email: string;
  grupoId: string;
}

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
    Tooltip,
    DatePickerModule,
    SelectModule,
    TabsModule,
    TimelineModule,
    AvatarModule,
    CheckboxModule,
    MessageModule,
    ToastModule,
    ConfirmDialogModule,
    EditorModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group implements OnInit, OnDestroy {
  private readonly apiUrl = environment.apiGateway;

  // Data arrays (loaded from backend)
  allGroups: GroupItem[] = [];
  allTickets: TicketItem[] = [];
  allMembers: GroupMember[] = [];
  allPermissions: any[] = [];
  isLoading = false;

  // Member dialog
  showAddMemberDialog = false;
  addMemberGroupId: string = '';
  newMemberNombre = '';
  newMemberEmail = '';
  selectedUserId: string = '';
  availableUsers: any[] = [];
  userSearchTerm = '';
  private searchTimeout: any = null;
  expandedGroupId: string | null = null;

  // Member permissions dialog
  showMemberPermissionsDialog = false;
  selectedMemberForPermissions: GroupMember | null = null;
  memberPermissions: any[] = [];
  availableGroupPermissions: any[] = [];
  selectedPermissionsForMember: string[] = [];
  isLoadingPermissions = false;

  // Group dialog
  showDialog = false;
  editMode = false;
  selectedGroup: GroupItem = this.emptyGroup();

  // Ticket dialog
  showTicketDialog = false;
  ticketEditMode = false;

  // Detalles del ticket interactivo (Historial y Comentarios)
  showTicketDetailsDialog = false;
  selectedTicketDetails: TicketItem | null = null;
  ticketComments: any[] = [];
  ticketHistory: any[] = [];
  newCommentText: string = '';
  isDetailsLoading = false;

  selectedTicket: TicketItem = this.emptyTicket();
  currentGroupId: string = '';
  groupMembers: any[] = [];
  today = new Date();

  // View
  viewMode: 'kanban' | 'list' = 'kanban';
  activeFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
  showTicketStatusDialog = false;

  // Per-group ticket panel expansion
  expandedGroupTicketId: string | null = null;
  // Per-group ticket filter: groupId -> 'all' | 'mine'
  groupTicketFilter: Record<string, 'all' | 'mine'> = {};

  nivelesOptions = [
    { label: 'Alto', value: 'Alto' },
    { label: 'Medio', value: 'Medio' },
    { label: 'Bajo', value: 'Bajo' },
  ];

  estadoOptions: { label: string; value: string }[] = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En progreso', value: 'En progreso' },
    { label: 'Revisión', value: 'Revisión' },
    { label: 'Bloqueado', value: 'Bloqueado' },
    { label: 'Finalizado', value: 'Finalizado' },
  ];

  prioridadOptions: { label: string; value: string }[] = [
    { label: 'Mínima', value: 'Mínima' },
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Urgente', value: 'Urgente' },
  ];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    public ps: PermissionService,
    private authService: AuthService,
    private http: HttpClient, private router: Router,
  ) {}

  
  goToTickets(groupId: string) {
    this.router.navigate(['/home/tickets', groupId]);
  }

  ngOnInit(): void {
    // Always load — the backend filters groups by user's actual permissions.
    // We cannot rely solely on the JWT grupos because the token may be stale
    // (e.g. user was just added to a group).
    this.loadGroups();
    this.loadPermissions();
    this.loadEstados();
    this.loadPrioridades();

    // Suscribirse a eventos SSE para actualización en tiempo real
    this.authService.registerTicketCallback(this.onTicketEvent);
    this.authService.registerPermissionsCallback(this.onPermissionsEvent);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    // Desuscribirse de eventos SSE para evitar memory leaks
    this.authService.unregisterTicketCallback(this.onTicketEvent);
    this.authService.unregisterPermissionsCallback(this.onPermissionsEvent);
  }

  // Referencias para desuscripción - DEBEN SER LAS MISMAS que se registran
  private onTicketEvent = (type: string, data: any) => {
    console.log('[Group] Received ticket SSE event:', type, data);
    this.loadTickets();
    this.cdr.markForCheck();
  };

  private onPermissionsEvent = () => {
    console.log('[Group] Received permissions SSE event');
    this.loadGroups();
    this.loadPermissions();
    this.cdr.markForCheck();
  };

  private canAccessGroups(): boolean {
    // If groups loaded from backend, at least one existed = has access
    if (this.allGroups && this.allGroups.length > 0) return true;
    return this.authService.isSuperAdmin();
  }

  // ====== Backend Calls ======
  loadGroups(): void {
    this.isLoading = true
    this.http.get<any>(`${this.apiUrl}/groups`, { withCredentials: true }).subscribe({
      next: (response) => {
        const rawGroups = response?.data?.data || response?.data || []
        this.allGroups = Array.isArray(rawGroups) ? rawGroups.map((g: any) => this.mapBackendGroup(g)) : []
        this.loadTickets()
        this.loadMembers()
        this.isLoading = false
        this.cdr.markForCheck()
      },
      error: () => {
        this.allGroups = []
        this.isLoading = false
        this.cdr.markForCheck()
      },
    })
  }

  private mapBackendGroup(group: any): GroupItem {
    return {
      id: group.id,
      nivel: group.nivel || 'Medio',
      autoridad: group.autoridad || '',
      nombre: group.nombre,
      integrantes: group.miembros_count !== undefined ? group.miembros_count : (group.miembros?.length || group.integrantes || 0),
      tickets: group.tickets || 0,
      descripcion: group.descripcion || '',
      adminId: group.creador_id || group.adminId || '',
      userIds: group.miembros?.map((m: any) => m.usuario_id) || group.userIds || [],
      esMiembro: group.es_miembro || false,
      esCreador: group.es_creador || false,
      permisosLocales: group.permisos_locales || [],
    };
  }

  /**
   * Combina permisos del token JWT (primaria) con permisos_locales del backend (respaldo)
   */
  private getCombinedPermissions(group: GroupItem): string[] {
    const tokenPerms = this.authService.getUserPermissionsForGroup(group.id) || [];
    const localPerms = group.permisosLocales || [];
    const combined = [...new Set([...tokenPerms, ...localPerms])];
    return combined;
  }

  /**
   * Checks if the current user has at least ONE of the given permissions
   * specifically for this group (local level), OR is a global admin/creator.
   */
  hasGroupLocalPermission(group: GroupItem, ...perms: string[]): boolean {
    // Global bypass
    if (this.authService.isSuperAdmin()) return true;
    if (this.authService.hasGlobalPermission('group:manage')) return true;

    // Creator of the group has all permissions
    if (group.esCreador) return true;

    // Combine token permissions + local permissions
    const combinedPerms = this.getCombinedPermissions(group);
    if (combinedPerms.includes('group:manage')) return true;
    return perms.some(p => combinedPerms.includes(p));
  }

  /**
   * Checks if user can manage/create tickets inside this group.
   */
  hasTicketLocalManage(group: GroupItem): boolean {
    if (this.authService.isSuperAdmin()) return true;
    if (this.authService.hasGlobalPermission('ticket:manage') || this.authService.hasGlobalPermission('group:manage')) return true;
    if (group.esCreador) return true;

    const combinedPerms = this.getCombinedPermissions(group);
    return combinedPerms.includes('group:manage') || combinedPerms.includes('ticket:manage');
  }

  /**
   * Checks if user can SEE ticket details for a given group.
   */
  hasTicketViewForGroup(group: GroupItem): boolean {
    if (this.authService.isSuperAdmin()) return true;
    if (this.authService.hasGlobalPermission('ticket:view') || this.authService.hasGlobalPermission('group:manage')) return true;
    if (group.esCreador) return true;

    const combinedPerms = this.getCombinedPermissions(group);
    return combinedPerms.includes('ticket:view') || combinedPerms.includes('group:manage');
  }

  loadPermissions(): void {
    this.http
      .get<any>(`${this.apiUrl}/users/permissions/list`, { withCredentials: true })
      .subscribe({
        next: (response: any) => {
          const rawPerms = response?.data?.[0]?.data || response?.data || response || [];
          this.allPermissions = Array.isArray(rawPerms) ? rawPerms : [];
        },
        error: (err) => console.error('Error loading permissions', err),
      });
  }

  loadEstados(): void {
    this.http.get<any>(`${this.apiUrl}/tickets/estados`, { withCredentials: true }).subscribe({
      next: (response) => {
        const rawEstados = response?.data?.data || response?.data || []
        if (Array.isArray(rawEstados) && rawEstados.length > 0) {
          this.estadoOptions = rawEstados.map((e: any) => ({ label: e.nombre, value: e.id }))
        }
      },
      error: (err) => console.error('loadEstados error:', err)
    })
  }

  loadPrioridades(): void {
    this.http.get<any>(`${this.apiUrl}/tickets/prioridades`, { withCredentials: true }).subscribe({
      next: (response) => {
        const rawPrioridades = response?.data?.data || response?.data || []
        if (Array.isArray(rawPrioridades) && rawPrioridades.length > 0) {
          this.prioridadOptions = rawPrioridades.map((p: any) => ({ label: p.nombre, value: p.id }))
        }
      },
      error: (err) => console.error('loadPrioridades error:', err)
    })
  }

  loadTickets(): void {
    const hasTicketPermission =
      this.authService.isSuperAdmin() ||
      this.ps.hasPermission('ticket:view') ||
      this.allGroups.some(g => this.hasTicketViewForGroup(g));

    if (!hasTicketPermission) {
      this.allTickets = [];
      return;
    }

    this.http.get<any>(`${this.apiUrl}/tickets`, { withCredentials: true }).subscribe({
      next: (response) => {
        const rawTickets = response?.data || []
        this.allTickets = Array.isArray(rawTickets) ? rawTickets.map((t: any) => this.mapBackendTicket(t)) : []

        // Sync real ticket counts from the loaded list
        if (this.allGroups && this.allGroups.length > 0) {
          this.allGroups = this.allGroups.map(g => ({
            ...g,
            tickets: this.allTickets.filter(t => t.grupoId === g.id).length,
          }));
        }

        // Auto-expand the first group that has tickets so they're immediately visible
        if (this.expandedGroupTicketId === null && this.allTickets.length > 0) {
          const firstGroupWithTickets = this.allGroups.find(
            g => this.allTickets.some(t => t.grupoId === g.id) && this.hasTicketViewForGroup(g)
          );
          if (firstGroupWithTickets) {
            this.expandedGroupTicketId = firstGroupWithTickets.id;
            this.groupTicketFilter[firstGroupWithTickets.id] = 'all';
          }
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.allTickets = [];
      },
    });
  }

  private mapBackendTicket(ticket: any): TicketItem {
    return {
      id: ticket.id,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      estado: ticket.estado?.nombre || ticket.estado || 'Pendiente',
      estadoId: ticket.estado?.id || ticket.estado_id || '',
      prioridad: ticket.prioridad?.nombre || ticket.prioridad || 'Media',
      prioridadId: ticket.prioridad?.id || ticket.prioridad_id || '',
      asignadoA: ticket.asignado?.nombre_completo || ticket.asignado?.email || ticket.asignadoA || '',
      asignadoId: ticket.asignado?.id || '',
      creadoPor: ticket.autor?.nombre_completo || ticket.creadorId || '',
      fechaCreacion: ticket.creado_en ? new Date(ticket.creado_en) : new Date(),
      fechaLimite: ticket.fecha_final ? new Date(ticket.fecha_final) : null,
      fechaFinal: null,
      comentarios: ticket.comentarios || '0',
      historialCambios: ticket.historialCambios || [],
      grupoId: ticket.grupo?.id || ticket.grupoId || ticket.grupo_id || '',
    };
  }

  loadMembers(): void {
    if (!this.canAccessGroups()) {
      this.allMembers = [];
      return;
    }
    
    this.http
      .get<any>(`${this.apiUrl}/groups/members`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          const rawMembers = response?.data?.data || response?.data || [];
          this.allMembers = Array.isArray(rawMembers) 
            ? rawMembers.map((m: any) => this.mapBackendMember(m)) 
            : [];
        },
        error: (err) => {
          console.error('Error loading members', err);
          this.allMembers = [];
        },
      });
  }

  private mapBackendMember(member: any): GroupMember {
    return {
      id: member.usuarioId || member.id || '',
      nombre: member.usuarioNombre || member.nombre_completo || member.nombre || '',
      email: member.usuarioEmail || member.email || '',
      grupoId: member.grupoId || member.grupo_id || member.grupo?.id || '',
    };
  }

  // ====== Group Getters ======
  get groups(): GroupItem[] {
    // Si la lista allGroups ya filtra por backend (que devuelve solo los que el auth user es miembro/creador o admin global)
    // Devolverlos tal cual para permitir la evaluación individual de sus permisos locales.
    return Array.isArray(this.allGroups) ? this.allGroups : [];
  }

  get currentUserName(): string {
    const user = this.authService?.getUser();
    return user?.nombre_completo || user?.nombreCompleto || '';
  }

  // ====== Group CRUD ======
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
      userIds: [],
    };
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
    const payload = {
      nombre: this.selectedGroup.nombre,
      descripcion: this.selectedGroup.descripcion
    };

    if (this.editMode) {
      this.http
        .put(`${this.apiUrl}/groups/${this.selectedGroup.id}`, payload, {
          withCredentials: true,
        })
        .subscribe({
          next: () => {
            this.loadGroups();
            this.showDialog = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Grupo actualizado correctamente',
            });
          },
          error: (err) => console.error('Error updating group', err),
        });
    } else {
      this.http
        .post<GroupItem>(`${this.apiUrl}/groups`, payload, { withCredentials: true })
        .subscribe({
          next: () => {
            this.loadGroups();
            this.showDialog = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Grupo creado correctamente',
            });
          },
          error: (err) => {
            console.error('Error creating group', err);
            this.showDialog = false;
            this.loadGroups();
          },
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
          error: (err) => console.error('Error deleting group', err),
        });
      },
    });
  }

  // ====== Ticket CRUD ======
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
      creadoPor: this.currentUserName,
      fechaCreacion: new Date(),
      fechaLimite: null,
      fechaFinal: null,
      comentarios: '',
      historialCambios: [],
      grupoId: '',
    };
  }

  openNewTicket(groupId: string): void {
    this.selectedTicket = this.emptyTicket()
    this.selectedTicket.grupoId = groupId
    this.selectedTicket.creadoPor = this.currentUserName
    this.currentGroupId = groupId
    this.ticketEditMode = false
    
    if (this.estadoOptions.length > 0) {
      this.selectedTicket.estadoId = this.estadoOptions[0].value
      this.selectedTicket.estado = this.estadoOptions[0].label
    }

    if (this.prioridadOptions.length > 1) {
      this.selectedTicket.prioridadId = this.prioridadOptions[1].value
      this.selectedTicket.prioridad = this.prioridadOptions[1].label
    } else if (this.prioridadOptions.length > 0) {
      this.selectedTicket.prioridadId = this.prioridadOptions[0].value
      this.selectedTicket.prioridad = this.prioridadOptions[0].label
    }

    this.groupMembers = []
    this.loadGroupMembers(groupId, () => {
      this.showTicketDialog = true
    })
  }

  loadGroupMembers(groupId: string, callback?: () => void): void {
    this.http.get<any>(`${this.apiUrl}/groups/${groupId}/members`, { withCredentials: true }).subscribe({
      next: (response) => {
        const rawMembers = response?.data?.data || response?.data || []
        this.groupMembers = Array.isArray(rawMembers) ? rawMembers.map((m: any) => ({
          ...m,
          nombreDisplay: m.nombre || m.usuario?.nombre_completo || '',
          emailDisplay: m.email || m.usuario?.email || '',
          nombre: m.nombre || m.usuario?.nombre_completo || ''
        })) : []
        
        if (this.ticketEditMode && this.selectedTicket.asignadoId) {
          const member = this.groupMembers.find(m => m.usuario_id === this.selectedTicket.asignadoId)
          if (member) {
            this.selectedTicket.asignadoA = member.nombreDisplay || member.nombre || ''
          }
        }
        
        setTimeout(() => {
          if (callback) {
            callback();
          }
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        this.groupMembers = []
        setTimeout(() => {
          if (callback) {
            callback();
          }
          this.cdr.detectChanges();
        }, 0);
      },
    })
  }

  onAssignedMemberChange(event: any): void {
    const memberId = event.value;
    const member = this.groupMembers.find(m => m.usuario_id === memberId);
    if (member) {
      this.selectedTicket.asignadoA = member.nombreDisplay || member.nombre || '';
      this.selectedTicket.asignadoId = member.usuario_id;
    } else {
      this.selectedTicket.asignadoA = '';
      this.selectedTicket.asignadoId = '';
    }
  }

  editTicket(ticket: TicketItem): void {
    this.selectedTicket = { 
      ...ticket, 
      historialCambios: [...ticket.historialCambios],
      estadoId: ticket.estadoId || '',
      prioridadId: ticket.prioridadId || '',
    };
    this.currentGroupId = ticket.grupoId;
    this.ticketEditMode = true;
    this.groupMembers = [];
    this.loadGroupMembers(ticket.grupoId);
    this.showTicketDialog = true;
  }

  canFullEditTicket(ticket: TicketItem): boolean {
    if (this.authService.hasGlobalPermission('ticket:edit') || this.authService.hasGlobalPermission('ticket:manage')) return true;
    return ticket.creadoPor === this.currentUserName;
  }

  canStatusEditTicket(ticket: TicketItem): boolean {
    return ticket.asignadoA === this.currentUserName && !this.canFullEditTicket(ticket);
  }

  saveTicket(): void {
    if (!this.selectedTicket.titulo || !this.selectedTicket.grupoId || !this.selectedTicket.estadoId || !this.selectedTicket.prioridadId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Faltan campos requeridos',
      })
      return
    }

    const ticketPayload: any = {
      titulo: this.selectedTicket.titulo,
      descripcion: this.selectedTicket.descripcion,
      grupo_id: this.selectedTicket.grupoId,
      estado_id: this.selectedTicket.estadoId,
      prioridad_id: this.selectedTicket.prioridadId,
    }

    if (this.selectedTicket.asignadoId) {
      ticketPayload.asignado_id = this.selectedTicket.asignadoId
    }

    if (this.selectedTicket.fechaLimite) {
      ticketPayload.fecha_final = new Date(this.selectedTicket.fechaLimite).toISOString();
    } else {
      ticketPayload.fecha_final = null;
    }
    
    if (this.ticketEditMode) {
      // Backend has PUT /:id (not PATCH)
      this.http
        .put(`${this.apiUrl}/tickets/${this.selectedTicket.id}`, ticketPayload, {
          withCredentials: true,
        })
        .subscribe({
          next: () => {
            this.loadTickets()
            setTimeout(() => {
              this.showTicketDialog = false
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Ticket actualizado correctamente',
              })
              this.cdr.markForCheck()
            }, 0)
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar ticket',
            })
          },
        })
    } else {
      this.http
        .post<TicketItem>(`${this.apiUrl}/tickets`, ticketPayload, { withCredentials: true })
        .subscribe({
          next: () => {
            this.loadTickets()
            setTimeout(() => {
              this.showTicketDialog = false
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Ticket creado correctamente',
              })
              this.cdr.detectChanges()
            }, 0)
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear ticket',
            })
          },
        })
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
        this.http
          .delete(`${this.apiUrl}/tickets/${ticket.id}`, { withCredentials: true })
          .subscribe({
            next: () => this.loadTickets(),
            error: (err) => console.error('Error deleting ticket', err),
          });
      },
    });
  }

  // ==== TICKET DETAILS, HISTORY & COMMENTS ====
  
  openTicketDetails(ticket: TicketItem) {
    this.selectedTicketDetails = ticket;
    this.showTicketDetailsDialog = true;
    this.fetchTicketHistory(ticket.id);
    this.fetchTicketComments(ticket.id);
  }

  fetchTicketHistory(ticketId: string) {
    this.isDetailsLoading = true;
    this.http.get<any>(`${this.apiUrl}/tickets/${ticketId}/historial`, { withCredentials: true }).subscribe({
      next: (res) => {
        if (res.data) {
          this.ticketHistory = res.data;
        }
        this.isDetailsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => this.isDetailsLoading = false
    });
  }

  fetchTicketComments(ticketId: string) {
    this.isDetailsLoading = true;
    this.http.get<any>(`${this.apiUrl}/comentarios?ticket_id=${ticketId}`, { withCredentials: true }).subscribe({
      next: (res) => {
        if (res.data) {
          this.ticketComments = res.data;
        }
        this.isDetailsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => this.isDetailsLoading = false
    });
  }

  postComment() {
    if (!this.newCommentText.trim() || !this.selectedTicketDetails) return;
    
    const payload = {
      ticket_id: this.selectedTicketDetails.id,
      contenido: this.newCommentText.trim()
    };
    
    this.http.post<any>(`${this.apiUrl}/comentarios`, payload, { withCredentials: true }).subscribe({
        next: (res) => {
            this.newCommentText = '';
            this.fetchTicketComments(this.selectedTicketDetails!.id); // refrescar chat
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Comentario agregado' });
        },
        error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No tienes permiso o error al enviar' });
        }
    });
  }

  getTicketsByGroup(groupId: string): TicketItem[] {
    return this.applyFilter(this.allTickets.filter((t) => t.grupoId === groupId));
  }

  getTicketsByGroupAndStatus(groupId: string, estado: string): TicketItem[] {
    return this.applyFilter(
      this.allTickets.filter((t) => t.grupoId === groupId && t.estado === estado),
    );
  }

  setFilter(filter: 'all' | 'mine' | 'unassigned' | 'high'): void {
    this.activeFilter = filter;
  }

  private applyFilter(tickets: TicketItem[]): TicketItem[] {
    switch (this.activeFilter) {
      case 'mine':
        return tickets.filter((t) => t.asignadoA === this.currentUserName);
      case 'unassigned':
        return tickets.filter((t) => !t.asignadoA || t.asignadoA.trim() === '');
      case 'high':
        return tickets.filter((t) => t.prioridad === 'Alta' || t.prioridad === 'Urgente');
      default:
        return tickets;
    }
  }

  // ====== Ticket Status Dialog ======
  editTicketStatus(ticket: TicketItem): void {
    this.selectedTicket = { ...ticket, historialCambios: [...ticket.historialCambios] };
    this.currentGroupId = ticket.grupoId;
    this.showTicketStatusDialog = true;
  }

  saveTicketStatus(): void {
    // Backend endpoint: PUT /:id/estado  (expects estado_id, not estado name)
    this.http
      .put(
        `${this.apiUrl}/tickets/${this.selectedTicket.id}/estado`,
        { estado_id: this.selectedTicket.estadoId },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          this.loadTickets();
          setTimeout(() => {
            this.showTicketStatusDialog = false;
            this.cdr.markForCheck();
          }, 0);
        },
        error: (err) => console.error('Error updating ticket status', err),
      });
  }

  // ====== Members ======
  getMembersByGroup(groupId: string): GroupMember[] {
    return this.allMembers.filter((m) => m.grupoId === groupId);
  }

  openAddMember(groupId: string): void {
    this.addMemberGroupId = groupId;
    this.newMemberNombre = '';
    this.newMemberEmail = '';
    this.selectedUserId = '';
    this.availableUsers = [];
    this.loadAvailableUsers(() => {
      this.showAddMemberDialog = true;
      this.cdr.markForCheck();
    });
  }

  onUserSearch(event: any): void {
    // PrimeNG filtra localmente los usuarios que ya están en availableUsers
    // No necesitamos llamar al backend
    // El filtro local es más rápido y no requiere permisos especiales
  }

  loadAvailableUsers(callback?: () => void): void {
    this.http.get<any>(`${this.apiUrl}/users`, { withCredentials: true }).subscribe({
      next: (response) => {
        let rawUsers: any[] = [];
        const rData = response?.data;
        
        if (Array.isArray(rData)) {
          if (rData.length > 0 && rData[0].data && Array.isArray(rData[0].data)) {
            rawUsers = rData[0].data; // Formato: data: [{ data: [...], total: 15 }]
          } else {
            rawUsers = rData;
          }
        } else if (rData?.data && Array.isArray(rData.data)) {
          rawUsers = rData.data;
        } else if (Array.isArray(response)) {
          rawUsers = response;
        }

        this.availableUsers = rawUsers
          .filter((u: any) => u.id !== this.currentUserId)
          .map((u: any) => ({
            id: u.id,
            nombre: u.nombre_completo || u.username || 'Usuario Desconocido',
            email: u.email || 'Sin correo',
          }));
          
        if (callback) callback();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading users', err);
        if (callback) callback();
      },
    });
  }


  addMember(): void {
    if (!this.selectedUserId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar un usuario',
      });
      return;
    }
    
    const payload = {
      usuario_id: this.selectedUserId,
    };
    
    this.http
      .post(`${this.apiUrl}/groups/${this.addMemberGroupId}/members`, payload, {
        withCredentials: true,
      })
      .subscribe({
        next: () => {
          this.loadMembers();
          this.loadGroups();
          this.showAddMemberDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario agregado al grupo correctamente',
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.message || 'Error al agregar usuario al grupo',
          });
        },
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
        this.http
          .delete(`${this.apiUrl}/groups/${groupId}/members/${member.id}`, {
            withCredentials: true,
          })
          .subscribe({
            next: () => {
              this.loadMembers();
              this.loadGroups();
            },
            error: (err) => console.error('Error removing member', err),
          });
      },
    });
  }

  toggleMembers(groupId: string): void {
    this.expandedGroupId = this.expandedGroupId === groupId ? null : groupId;
  }

  getGroupName(groupId: string): string {
    if (!this.allGroups || !Array.isArray(this.allGroups)) {
      return '';
    }
    return this.allGroups.find((g) => g.id === groupId)?.nombre ?? '';
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
        return 'warn';
      case 'Media':
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

  get hasGroupActions(): boolean {
    // Show the actions column if ANY loaded group has at least one action-triggering local perm
    return this.allGroups.some(g =>
      g.esCreador ||
      this.ps.hasPermission('superadmin') ||
      this.ps.hasPermission('group:manage') ||
      (g.permisosLocales || []).some(p =>
        ['group:edit', 'group:delete', 'group:manage', 'ticket:add', 'group:add:miembro'].includes(p)
      )
    );
  }

  get currentUserId(): string {
    return this.authService.getUser()?.id || '';
  }

  /** Toggle per-group ticket accordion */
  toggleGroupTickets(groupId: string): void {
    this.expandedGroupTicketId = this.expandedGroupTicketId === groupId ? null : groupId;
    if (this.expandedGroupTicketId && !this.groupTicketFilter[groupId]) {
      this.groupTicketFilter[groupId] = 'all';
    }
  }

  /** Set per-group 'all' | 'mine' filter */
  setGroupTicketFilter(groupId: string, filter: 'all' | 'mine'): void {
    this.groupTicketFilter = { ...this.groupTicketFilter, [groupId]: filter };
  }

  /** True if the current user created this group */
  isCreatorOfGroup(group: GroupItem): boolean {
    return !!group.esCreador;
  }

  /** Get filtered tickets for a group panel.
   * Backend already returns only what the user can see:
   *   - creador  → all tickets of the group
   *   - member   → only tickets assigned to them
   * The 'mine' tab is an extra client-side sub-filter on top of that.
   */
  getGroupTickets(groupId: string): TicketItem[] {
    const base = this.allTickets.filter(t => t.grupoId === groupId);
    const filter = this.groupTicketFilter[groupId] || 'all';
    if (filter === 'mine') {
      return base.filter(t => t.asignadoId === this.currentUserId || t.asignadoA === this.currentUserName);
    }
    return base;
  }

  getGroupTicketsByStatus(groupId: string, estadoId: string): TicketItem[] {
    return this.getGroupTickets(groupId).filter(t => t.estadoId === estadoId);
  }

  getMyTicketCount(groupId: string): number {
    return this.allTickets.filter(
      t => t.grupoId === groupId &&
           (t.asignadoId === this.currentUserId || t.asignadoA === this.currentUserName)
    ).length;
  }

  /** Can the current user assign tickets inside this specific group? */
  canAssignTicketInGroup(group: GroupItem): boolean {
    if (this.authService.isSuperAdmin()) return true;
    if (this.authService.hasGlobalPermission('ticket:manage') || this.authService.hasGlobalPermission('group:manage')) return true;
    if (group.esCreador) return true;
    const local = this.getCombinedPermissions(group);
    return local.includes('ticket:assign') || local.includes('ticket:manage') || local.includes('group:manage');
  }

  /** Can user fully edit a ticket (title, desc, assignee, priority)? */
  canFullEditTicketInGroup(ticket: TicketItem, group: GroupItem): boolean {
    if (this.authService.isSuperAdmin()) return true;
    if (this.authService.hasGlobalPermission('ticket:edit') || this.authService.hasGlobalPermission('ticket:manage') || this.authService.hasGlobalPermission('group:manage')) return true;
    if (group.esCreador) return true;
    const local = this.getCombinedPermissions(group);
    if (local.includes('ticket:edit') || local.includes('ticket:manage') || local.includes('group:manage')) return true;
    // Original creator can always edit their own ticket
    return ticket.creadoPor === this.currentUserName;
  }

  /** Can user only change the status (assigned user, not full edit)? */
  canStatusEditTicketInGroup(ticket: TicketItem, group: GroupItem): boolean {
    if (this.canFullEditTicketInGroup(ticket, group)) return false;
    const local = this.getCombinedPermissions(group);
    return local.includes('ticket:edit:state') || local.includes('ticket:edit:comment');
  }

  /** Unified check for dragging kanban cards */
  canEditTicketState(ticket: TicketItem, group: GroupItem): boolean {
    if (this.authService.isSuperAdmin()) return true;
    if (this.authService.hasGlobalPermission('ticket:manage')) return true;
    if (group.esCreador) return true;
    const local = this.getCombinedPermissions(group);
    if (local.includes('group:manage') || local.includes('ticket:manage')) return true;
    
    // El usuario debe tener explícitamente el permiso de editar estado (o edición completa).
    // Que esté asignado al ticket o lo haya creado ya NO le da derecho otomatisco de mover el kanban sin el permiso.
    return local.includes('ticket:edit:state') || local.includes('ticket:edit');
  }

  canCommentSelectedTicket(): boolean {
    if (!this.selectedTicket) return false;
    const group = this.allGroups.find(g => g.id === this.selectedTicket.grupoId);
    if (!group) return false;
    
    if (this.authService.isSuperAdmin() || group.esCreador) return true;
    const local = this.getCombinedPermissions(group);
    if (local.includes('group:manage') || local.includes('ticket:manage')) return true;
    
    return local.includes('ticket:edit:comment') || local.includes('ticket:edit');
  }
  
  canChangeStatusSelectedTicket(): boolean {
    if (!this.selectedTicket) return false;
    const group = this.allGroups.find(g => g.id === this.selectedTicket.grupoId);
    if (!group) return false;
    
    if (this.authService.isSuperAdmin() || group.esCreador) return true;
    const local = this.getCombinedPermissions(group);
    if (local.includes('group:manage') || local.includes('ticket:manage')) return true;
    
    return local.includes('ticket:edit:state') || local.includes('ticket:edit');
  }

  /** Can user delete a ticket? */
  canDeleteTicketInGroup(group: GroupItem): boolean {
    if (this.authService.isSuperAdmin()) return true;
    if (this.authService.hasGlobalPermission('ticket:delete') || this.authService.hasGlobalPermission('ticket:manage') || this.authService.hasGlobalPermission('group:manage')) return true;
    if (group.esCreador) return true;
    const local = this.getCombinedPermissions(group);
    return local.includes('ticket:delete') || local.includes('ticket:manage') || local.includes('group:manage');
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

  onDrop(event: DragEvent, nuevoEstadoId: string): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    
    if (!this.draggedTicket || this.draggedTicket.estadoId === nuevoEstadoId) {
      this.draggedTicket = null;
      return;
    }

    const ticketToUpdate = this.draggedTicket;
    const oldEstadoId = ticketToUpdate.estadoId;
    const oldEstadoName = ticketToUpdate.estado;
    const nuevoEstadoItem = this.estadoOptions.find(e => e.value === nuevoEstadoId);

    // Actualización optimista (instantánea para el UI kanban)
    ticketToUpdate.estadoId = nuevoEstadoId;
    ticketToUpdate.estado = nuevoEstadoItem ? nuevoEstadoItem.label : ticketToUpdate.estado;
    this.cdr.markForCheck();

    // Update via backend de fondo
    this.http
      .put(
        `${this.apiUrl}/tickets/${ticketToUpdate.id}/estado`,
        { estado_id: nuevoEstadoId },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          // Ya no bloqueamos la UI con loadTickets() para actualizar el DOM principal.
        },
        error: (err) => {
          console.error('Error updating ticket status via drag', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cambiar de estado' });
          
          // Reversión visual si falló
          ticketToUpdate.estadoId = oldEstadoId;
          ticketToUpdate.estado = oldEstadoName;
          this.cdr.markForCheck();
        },
      });
      
    this.draggedTicket = null;
  }

  getUserInitial(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarGradient(name: string): string {
    if (!name) return 'linear-gradient(135deg, #a78bfa, #7c3aed)';
    const gradients = [
      'linear-gradient(135deg, #f472b6, #db2777)',
      'linear-gradient(135deg, #60a5fa, #2563eb)',
      'linear-gradient(135deg, #34d399, #059669)',
      'linear-gradient(135deg, #fbbf24, #d97706)',
      'linear-gradient(135deg, #a78bfa, #7c3aed)',
      'linear-gradient(135deg, #f87171, #dc2626)',
      'linear-gradient(135deg, #2dd4bf, #0d9488)',
      'linear-gradient(135deg, #818cf8, #6366f1)',
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  // ====== Member Permissions Management ======
  openMemberPermissions(member: GroupMember, groupId: string): void {
    this.selectedMemberForPermissions = member;
    this.addMemberGroupId = groupId;
    this.memberPermissions = [];
    this.selectedPermissionsForMember = [];
    this.showMemberPermissionsDialog = true;
    this.loadMemberPermissions(groupId, member.id);
    this.loadAvailableGroupPermissions();
  }

  loadMemberPermissions(groupId: string, memberId: string): void {
    this.isLoadingPermissions = true;
    this.http
      .get<any>(`${this.apiUrl}/groups/${groupId}/members/${memberId}/permissions`, {
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          const rawPerms = response?.data?.data || response?.data || [];
          this.memberPermissions = Array.isArray(rawPerms) ? rawPerms : [];
          this.selectedPermissionsForMember = [...this.memberPermissions.map((p: any) => p.nombre)];
          this.isLoadingPermissions = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading member permissions', err);
          this.memberPermissions = [];
          this.isLoadingPermissions = false;
          this.cdr.markForCheck();
        },
      });
  }

  loadAvailableGroupPermissions(): void {
    this.http
      .get<any>(`${this.apiUrl}/groups/permissions`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          const rawPerms = response?.data?.data || response?.data || [];
          this.availableGroupPermissions = Array.isArray(rawPerms) ? rawPerms : [];
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading permissions', err),
      });
  }

  get allPermissionsSelected(): boolean {
    return this.availableGroupPermissions.length > 0 &&
      this.availableGroupPermissions.every(p => this.selectedPermissionsForMember.includes(p.nombre));
  }

  get somePermissionsSelected(): boolean {
    return this.selectedPermissionsForMember.length > 0 && !this.allPermissionsSelected;
  }

  toggleAllPermissions(): void {
    if (this.allPermissionsSelected) {
      this.selectedPermissionsForMember = [];
    } else {
      this.selectedPermissionsForMember = this.availableGroupPermissions.map(p => p.nombre);
    }
  }

  togglePermission(permissionName: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation(); // Evitar disparo doble por (click) vs (onChange)
    }
    
    const newSelection = [...this.selectedPermissionsForMember];
    const index = newSelection.indexOf(permissionName);
    if (index > -1) {
      newSelection.splice(index, 1);
    } else {
      newSelection.push(permissionName);
    }
    this.selectedPermissionsForMember = newSelection; // Reasignar para forzar Change Detection y sincronizar NgModel
  }

  saveMemberPermissions(): void {
    if (!this.selectedMemberForPermissions || !this.addMemberGroupId) return;

    const currentPerms = this.memberPermissions.map((p: any) => p.nombre);
    const toAdd = this.selectedPermissionsForMember.filter(p => !currentPerms.includes(p));
    const toRemove = currentPerms.filter(p => !this.selectedPermissionsForMember.includes(p));

    if (toAdd.length > 0) {
      this.http
        .post(
          `${this.apiUrl}/groups/${this.addMemberGroupId}/members/${this.selectedMemberForPermissions.id}/permissions`,
          { permisos: toAdd },
          { withCredentials: true },
        )
        .subscribe({
          next: () => {
            if (toRemove.length > 0) {
              this.removePermissions(toRemove);
            } else {
              this.showSuccessMessage('Permisos actualizados correctamente');
              this.loadMemberPermissions(this.addMemberGroupId, this.selectedMemberForPermissions!.id);
            }
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.message || 'Error al asignar permisos',
            });
          },
        });
    } else if (toRemove.length > 0) {
      this.removePermissions(toRemove);
    } else {
      this.showMemberPermissionsDialog = false;
    }
  }

  private removePermissions(permisos: string[]): void {
    this.http
      .request(
        'delete',
        `${this.apiUrl}/groups/${this.addMemberGroupId}/members/${this.selectedMemberForPermissions?.id}/permissions`,
        { body: { permisos }, withCredentials: true },
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Permisos actualizados correctamente');
          this.loadMemberPermissions(this.addMemberGroupId, this.selectedMemberForPermissions!.id);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.message || 'Error al quitar permisos',
          });
        },
      });
  }

  private showSuccessMessage(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail,
    });
    this.showMemberPermissionsDialog = false;
  }

  isPermissionSelected(permissionName: string): boolean {
    return this.selectedPermissionsForMember.includes(permissionName);
  }

  getPermissionDescription(permissionName: string): string {
    const perm = this.availableGroupPermissions.find(p => p.nombre === permissionName);
    return perm?.descripcion || '';
  }

  getPermissionDisplayName(permissionName: string): string {
    const labels: Record<string, string> = {
      'group:manage': 'Control Administrativo del Grupo',
      'group:edit': 'Modificar Detalles del Grupo',
      'group:delete': 'Eliminar Grupo Localmente',
      'group:add:miembro': 'Agregar Nuevos Integrantes',
      'ticket:add': 'Crear Nuevos Tickets',
      'ticket:view': 'Ver Tickets del Grupo',
      'ticket:manage': 'Administración Global de Tickets',
      'ticket:assign': 'Reasignar Responsables',
      'ticket:edit': 'Editar Contenido del Ticket',
      'ticket:edit:state': 'Actualizar Estado / Mover en Kanban',
      'ticket:edit:comment': 'Agregar Comentarios y Notas',
      'ticket:delete': 'Eliminar Tickets'
    };
    return labels[permissionName] || permissionName.replace(/:/g, ' ').toUpperCase();
  }

  isCreador(member: GroupMember | null | undefined): boolean {
    if (!member) return false;
    const group = this.allGroups.find(g => g.id === this.addMemberGroupId);
    return !!(group?.esCreador && member.id === group.adminId);
  }
}
