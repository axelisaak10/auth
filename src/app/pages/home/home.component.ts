import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  stats = [
    { label: 'Sesiones Activas', value: '1',    icon: 'pi-desktop',    color: '#0f3460' },
    { label: 'Mensajes',         value: '12',   icon: 'pi-envelope',   color: '#533483' },
    { label: 'Notificaciones',   value: '3',    icon: 'pi-bell',       color: '#f59e0b' },
    { label: 'Tareas Pendientes',value: '5',    icon: 'pi-check-square',color: '#10b981' },
  ];

  recentActivity = [
    { text: 'Inicio de sesión exitoso',            time: 'Hace un momento', icon: 'pi-sign-in',     severity: 'success' },
    { text: 'Perfil visualizado',                  time: 'Hace 5 min',      icon: 'pi-user',        severity: 'info'    },
    { text: 'Configuración actualizada',           time: 'Hace 1 hora',     icon: 'pi-cog',         severity: 'info'    },
    { text: 'Intento de acceso fallido detectado', time: 'Ayer',            icon: 'pi-exclamation-triangle', severity: 'warn' },
  ];
}