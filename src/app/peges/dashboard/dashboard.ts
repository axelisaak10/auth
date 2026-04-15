import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';


import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

interface GroupStat {
  id: string;
  nombre: string;
  total: number;
  byStatus: Record<string, { count: number, color: string }>;
  byPriority: Record<string, { count: number }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, Select, ChartModule,
    ProgressBarModule, TagModule, TooltipModule, CardModule, DividerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  userName = '';
  selectedGroupId: string | null = null;
  isLoading = true;

  // Backend Data
  rawStats: any = null;
  groups: { id: string, nombre: string }[] = [];

  // KPI
  kpiData = {
    total: 0,
    enProgreso: 0,
    finalizado: 0,
    pendientes: 0
  };

  // Charts
  statusChartData: any;
  statusChartOptions: any;
  priorityChartData: any;
  priorityChartOptions: any;

  resolutionRate = 0;

  private readonly apiUrl = environment.apiGateway;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    this.userName = user?.nombre_completo || user?.nombreCompleto || 'Usuario';
    this.initChartOptions();
    // Despertar el servicio de tikets en Render antes de cargar datos
    this.http.get(`${this.apiUrl}/tickets/ping`, { withCredentials: true }).subscribe({ error: () => {} });
    this.fetchStats();
  }

  fetchStats() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/tickets/stats`, { withCredentials: true }).subscribe({
      next: (res) => {
        const payload = (res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data[0] : (res.data || res);
        if (payload && typeof payload === 'object' && 'total' in payload) {
          this.rawStats = payload;
          this.parseGroups();
          this.calculateMetrics();
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching stats:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  parseGroups() {
    if (this.rawStats && this.rawStats.groups) {
      this.groups = this.rawStats.groups.map((g: GroupStat) => ({
        id: g.id,
        nombre: g.nombre
      }));
    }
  }

  onGroupChange() {
    this.calculateMetrics();
  }

  calculateMetrics() {
    if (!this.rawStats) return;

    let targetStatus: Record<string, { count: number, color: string }> = {};
    let targetPriority: Record<string, { count: number }> = {};
    let total = 0;

    if (this.selectedGroupId) {
      // Group Specific
      const g = this.rawStats.groups.find((gr: GroupStat) => gr.id === this.selectedGroupId);
      if (g) {
        targetStatus = g.byStatus;
        targetPriority = g.byPriority;
        total = g.total;
      }
    } else {
      // Global
      total = this.rawStats.total;
      targetStatus = this.rawStats.byStatus;
      targetPriority = this.rawStats.byPriority;
    }

    // Refresh KPIs
    this.kpiData.total = total;
    this.kpiData.enProgreso = (targetStatus['En progreso']?.count) || 0;
    this.kpiData.finalizado = (targetStatus['Finalizado']?.count) || 0;
    this.kpiData.pendientes = ((targetStatus['Pendiente']?.count || 0) + (targetStatus['Revisión']?.count || 0) + (targetStatus['Bloqueado']?.count || 0));

    // Calculate Resolution Rate
    if (total > 0) {
      this.resolutionRate = Math.round((this.kpiData.finalizado / total) * 100);
    } else {
      this.resolutionRate = 0;
    }

    // Refresh status chart
    const statusLabels = Object.keys(targetStatus);
    const statusData = statusLabels.map(l => targetStatus[l].count);
    const statusColors = statusLabels.map(l => targetStatus[l].color);
    
    this.statusChartData = {
      labels: statusLabels,
      datasets: [
        {
          data: statusData,
          backgroundColor: statusColors,
          hoverBackgroundColor: statusColors
        }
      ]
    };

    // Refresh priority chart
    const priorityLabels = Object.keys(targetPriority);
    const priorityData = priorityLabels.map(l => targetPriority[l].count);
    // Custom mapping for priority colors matching the theme
    const getPriorityColor = (p: string) => {
      if (p === 'Urgente' || p === 'Alta') return '#F54927';
      if (p === 'Media') return '#8b5cf6';
      return '#94a3b8'; // Baja, Mínima
    };

    this.priorityChartData = {
      labels: priorityLabels,
      datasets: [
        {
          label: 'Cantidad',
          data: priorityData,
          backgroundColor: priorityLabels.map(getPriorityColor),
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.6
        }
      ]
    };
  }

  initChartOptions() {
    this.statusChartOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, color: 'var(--text-color)' }
        }
      },
      cutout: '60%'
    };

    this.priorityChartOptions = {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: 'var(--text-color-secondary)' },
          grid: { display: false },
          border: { display: false }
        },
        y: {
          ticks: { color: 'var(--text-color-secondary)' },
          grid: { color: 'var(--surface-border)', tickLength: 0, drawBorder: false },
          border: { display: false, dash: [4, 4] },
          beginAtZero: true
        }
      }
    };
  }

  goToGroups() {
    this.router.navigate(['/home/group']);
  }
}
