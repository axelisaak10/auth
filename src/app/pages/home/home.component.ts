import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../auth/auth.service';
import { GroupsService, Group } from '../../services/groups.service';
import { ALL_TICKETS, KANBAN_COLS, TicketEstado } from '../tickets/tickets.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private auth   = inject(AuthService);
  private groups = inject(GroupsService);
  private router = inject(Router);

  readonly currentUser   = this.auth.currentUser;
  readonly selectedGroup = this.groups.selectedGroup;
  readonly llmModel      = 'claude-sonnet-4-6';
  readonly kanbanCols    = KANBAN_COLS;

  userGroups = computed(() => {
    const u = this.currentUser();
    return u ? this.groups.getGroupsForUser(u.username) : [];
  });

  groupStats = computed(() => {
    const g = this.selectedGroup();
    if (!g) return null;
    const tickets = ALL_TICKETS.filter(t =>
      t.grupo === g.name || g.members.some(m => t.asignadoA === m)
    );
    const byState = KANBAN_COLS.map(col => ({
      label: col.label, color: col.color, icon: col.icon,
      count: tickets.filter(t => t.estado === col.value).length,
    }));
    const recent = [...tickets]
      .sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
      .slice(0, 5);
    return { total: tickets.length, byState, recent };
  });

  selectGroup(group: Group)  { this.groups.selectGroup(group); }
  clearGroup()               { this.groups.selectGroup(null); }
  goToTickets()              { this.router.navigate(['/tickets']); }

  getStateColor(estado: TicketEstado): string {
    return KANBAN_COLS.find(c => c.value === estado)?.color ?? '#94a3b8';
  }
  getStateLabel(estado: TicketEstado): string {
    return KANBAN_COLS.find(c => c.value === estado)?.label ?? estado;
  }
}
