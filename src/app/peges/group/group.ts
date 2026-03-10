import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Tag } from 'primeng/tag';
import { Toolbar } from 'primeng/toolbar';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { HasPermissionDirective } from '../../directiva/directiva';
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
  adminId: string; // user.usuario of the basic admin
  userIds: string[];
}

@Component({
  selector: 'app-group',
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
    ConfirmDialog,
    Tooltip,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group implements OnInit {
  // Static mock groups
  allGroups: GroupItem[] = [
    {
      id: 'group-1',
      nivel: 'Alto',
      autoridad: 'Administrador General',
      nombre: 'Seguridad TI',
      integrantes: 4,
      tickets: 5,
      descripcion: 'Grupo encargado de la seguridad informática y auditorías.',
      adminId: 'admin_carlos',
      userIds: ['normal_user', 'maria_qa', 'pedro_dev']
    },
    {
      id: 'group-2',
      nivel: 'Medio',
      autoridad: 'Coordinador',
      nombre: 'Desarrollo Web',
      integrantes: 4,
      tickets: 10,
      descripcion: 'Equipo de desarrollo de APIs.',
      adminId: 'admin_dev',
      userIds: []
    }
  ];

  groups: GroupItem[] = [];
  
  showDialog = false;
  editMode = false;
  selectedGroup: GroupItem = this.emptyGroup();

  showMembersDialog = false;
  showWorkspaceDialog = false;
  activeGroupForMembers: GroupItem | null = null;
  newUserIdentifier = '';

  nivelesOptions = [
    { label: 'Alto', value: 'Alto' },
    { label: 'Medio', value: 'Medio' },
    { label: 'Bajo', value: 'Bajo' },
  ];

  constructor(
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    const user = this.authService.getUser();
    if (!user) return;

    if (this.permissionService.hasPermission('MANAGE_GROUPS')) {
      // Super admin sees all groups
      this.groups = [...this.allGroups];
    } else if (this.permissionService.hasPermission('VIEW_OWN_GROUP') && user.groupId) {
      // Basic admin or normal user sees only their group
      this.groups = this.allGroups.filter(g => g.id === user.groupId);
    } else {
      this.groups = [];
    }
  }

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
      userIds: []
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
    if (this.editMode) {
      const index = this.allGroups.findIndex((g) => g.id === this.selectedGroup.id);
      if (index !== -1) {
        this.allGroups[index] = { ...this.selectedGroup };
      }
    } else {
      this.selectedGroup.id = 'group-' + (this.allGroups.length + 1);
      this.allGroups.push({ ...this.selectedGroup });
    }
    this.loadGroups();
    this.showDialog = false;
  }

  editWorkspace(group: GroupItem): void {
    this.selectedGroup = { ...group };
    this.showWorkspaceDialog = true;
  }

  saveWorkspace(): void {
    const index = this.allGroups.findIndex((g) => g.id === this.selectedGroup.id);
    if (index !== -1) {
      // Basic admin can only edit name and description
      this.allGroups[index].nombre = this.selectedGroup.nombre;
      this.allGroups[index].descripcion = this.selectedGroup.descripcion;
    }
    this.loadGroups();
    this.showWorkspaceDialog = false;
  }

  openManageMembers(group: GroupItem): void {
    this.activeGroupForMembers = group;
    this.newUserIdentifier = '';
    this.showMembersDialog = true;
  }

  addUserToGroup(): void {
    if (!this.activeGroupForMembers || !this.newUserIdentifier.trim()) return;

    // Simulate adding user
    const groupId = this.activeGroupForMembers.id;
    const groupInAll = this.allGroups.find(g => g.id === groupId);
    if (groupInAll) {
      if (!groupInAll.userIds) groupInAll.userIds = [];
      groupInAll.userIds.push(this.newUserIdentifier.trim());
      groupInAll.integrantes = groupInAll.userIds.length + 1; // +1 for basic admin
    }
    
    this.newUserIdentifier = '';
    this.loadGroups();
    this.activeGroupForMembers = this.groups.find(g => g.id === groupId) || null;
  }

  removeUserFromGroup(identifier: string): void {
    if (!this.activeGroupForMembers) return;
    const groupId = this.activeGroupForMembers.id;
    const groupInAll = this.allGroups.find(g => g.id === groupId);
    if (groupInAll) {
      groupInAll.userIds = groupInAll.userIds.filter(id => id !== identifier);
      groupInAll.integrantes = groupInAll.userIds.length + 1;
    }
    this.loadGroups();
    this.activeGroupForMembers = this.groups.find(g => g.id === groupId) || null;
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
        this.allGroups = this.allGroups.filter((g) => g.id !== group.id);
        this.loadGroups();
      },
    });
  }

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

  get totalIntegrantes(): number {
    return this.groups.reduce((sum, g) => sum + g.integrantes, 0);
  }

  get totalTickets(): number {
    return this.groups.reduce((sum, g) => sum + g.tickets, 0);
  }
}
