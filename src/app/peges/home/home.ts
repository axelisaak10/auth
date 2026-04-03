import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

interface GroupInfo {
  id: number;
  nombre: string;
  descripcion: string;
  icon: string;
}

interface TicketSummary {
  titulo: string;
  estado: string;
  prioridad: string;
  asignadoA: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, Card, Tag, ButtonModule, Tooltip],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  selectedGroupId: number | null = null;
  llmModel = 'GPT-4o';

  allGroups: GroupInfo[] = [
    {
      id: 1,
      nombre: 'Seguridad TI',
      descripcion: 'Grupo encargado de la seguridad informática y auditorías.',
      icon: 'pi pi-shield',
    },
    {
      id: 2,
      nombre: 'Desarrollo Web',
      descripcion: 'Equipo de desarrollo de aplicaciones web y APIs.',
      icon: 'pi pi-code',
    },
    {
      id: 3,
      nombre: 'Soporte Técnico',
      descripcion: 'Atención y resolución de incidencias técnicas.',
      icon: 'pi pi-wrench',
    },
    {
      id: 4,
      nombre: 'Infraestructura',
      descripcion: 'Gestión de servidores, redes y servicios cloud.',
      icon: 'pi pi-server',
    },
    {
      id: 5,
      nombre: 'QA & Testing',
      descripcion: 'Pruebas de calidad y aseguramiento de software.',
      icon: 'pi pi-check-square',
    },
  ];

  private allTickets: {
    grupoId: number;
    titulo: string;
    estado: string;
    prioridad: string;
    asignadoA: string;
  }[] = [
    {
      grupoId: 1,
      titulo: 'Auditoría de accesos',
      estado: 'Pendiente',
      prioridad: 'Alta',
      asignadoA: 'María López',
    },
    {
      grupoId: 1,
      titulo: 'Actualizar firewall',
      estado: 'En progreso',
      prioridad: 'Urgente',
      asignadoA: 'Carlos Administrador',
    },
    {
      grupoId: 1,
      titulo: 'Revisar permisos',
      estado: 'Bloqueado',
      prioridad: 'Media',
      asignadoA: 'María López',
    },
    {
      grupoId: 1,
      titulo: 'Backup semanal',
      estado: 'Finalizado',
      prioridad: 'Baja',
      asignadoA: 'Pedro Sánchez',
    },
    {
      grupoId: 2,
      titulo: 'Deploy v2.0',
      estado: 'En progreso',
      prioridad: 'Alta',
      asignadoA: 'Juan Pérez',
    },
    {
      grupoId: 2,
      titulo: 'Fix login bug',
      estado: 'Pendiente',
      prioridad: 'Urgente',
      asignadoA: 'Ana García',
    },
    {
      grupoId: 2,
      titulo: 'API refactor',
      estado: 'Revisión',
      prioridad: 'Media',
      asignadoA: 'Juan Pérez',
    },
    {
      grupoId: 3,
      titulo: 'Ticket #201',
      estado: 'Pendiente',
      prioridad: 'Media-Baja',
      asignadoA: 'Pedro Sánchez',
    },
    {
      grupoId: 3,
      titulo: 'Ticket #202',
      estado: 'Finalizado',
      prioridad: 'Baja',
      asignadoA: 'Pedro Sánchez',
    },
  ];

  constructor(
    private authService: AuthService,
    private ps: PermissionService,
    private router: Router,
  ) {
    const user = this.authService.getUser();
    if (user?.grupoId) {
      this.selectedGroupId = user.grupoId;
    }
  }

  goToKanban(): void {
    this.router.navigate(['/home/group']);
  }

  get userName(): string {
    const user = this.authService?.getUser();
    return user?.nombre_completo || user?.nombreCompleto || 'Usuario';
  }

  get userGroups(): GroupInfo[] {
    const user = this.authService?.getUser();
    if (this.ps.hasAnyPermission('group:view')) {
      return this.allGroups;
    }
    if (user?.grupoId) {
      return this.allGroups.filter((g) => g.id === user.grupoId);
    }
    return [];
  }

  selectGroup(groupId: number): void {
    this.selectedGroupId = groupId;
  }

  backToGroups(): void {
    this.selectedGroupId = null;
  }

  get selectedGroup(): GroupInfo | undefined {
    return this.allGroups.find((g) => g.id === this.selectedGroupId);
  }

  get groupTickets(): TicketSummary[] {
    if (!this.selectedGroupId) return [];
    return this.allTickets.filter((t) => t.grupoId === this.selectedGroupId);
  }

  get ticketsPendientes(): number {
    return this.groupTickets.filter((t) => t.estado === 'Pendiente').length;
  }
  get ticketsEnProgreso(): number {
    return this.groupTickets.filter((t) => t.estado === 'En progreso').length;
  }
  get ticketsHechos(): number {
    return this.groupTickets.filter((t) => t.estado === 'Finalizado').length;
  }
  get ticketsBloqueados(): number {
    return this.groupTickets.filter((t) => t.estado === 'Bloqueado').length;
  }
  get ticketsRevision(): number {
    return this.groupTickets.filter((t) => t.estado === 'Revisión').length;
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
}
