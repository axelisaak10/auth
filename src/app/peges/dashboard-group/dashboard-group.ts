import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../services/auth.service';
import { Ticket } from '../../models/types';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-group',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule],
  templateUrl: './dashboard-group.html',
  styleUrl: './dashboard-group.css'
})
export class DashboardGroup implements OnInit {
  tickets: Ticket[] = [];
  recentTickets: Ticket[] = [];
  
  // Counters
  total = 0;
  pendientes = 0;
  enProgreso = 0;
  hechos = 0;
  bloqueados = 0;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    const user = this.authService.getUser();
    if (!user) return;

    // Static Ticket DB exactly like in tickets.ts wrapper
    const allTickets: Ticket[] = [
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

    // Filter by group
    const myTickets = allTickets.filter(t => t.groupId === user.grupoId?.toString());
    
    this.total = myTickets.length;
    this.pendientes = myTickets.filter(t => t.estado === 'Pendiente').length;
    this.enProgreso = myTickets.filter(t => t.estado === 'En progreso').length;
    this.hechos = myTickets.filter(t => t.estado === 'Hecho').length;
    this.bloqueados = myTickets.filter(t => t.estado === 'Revisión').length;

    // Get 5 most recent by fechaCreacion
    this.recentTickets = [...myTickets]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5);
  }

  goToTickets() {
    this.router.navigate(['/home/tickets']);
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
}
