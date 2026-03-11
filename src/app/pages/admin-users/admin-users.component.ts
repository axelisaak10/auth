import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule }       from 'primeng/table';
import { ButtonModule }      from 'primeng/button';
import { DialogModule }      from 'primeng/dialog';
import { CheckboxModule }    from 'primeng/checkbox';
import { TagModule }         from 'primeng/tag';
import { ToastModule }       from 'primeng/toast';
import { DividerModule }     from 'primeng/divider';
import { MessageService }    from 'primeng/api';

import { ALL_USERS } from '../../auth/auth.service';
import { UsersStoreService }      from '../../auth/users-store.service';
import { PERMISSIONS, Permission } from '../../auth/permissions';

interface UserRow {
  username: string;
  area: string;
  permissions: Permission[];
}

interface PermissionGroup {
  label: string;
  keys: { key: string; value: Permission }[];
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, DialogModule,
    CheckboxModule, TagModule, ToastModule, DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit {

  users: UserRow[] = [];
  dialogVisible = false;
  selectedUser: UserRow | null = null;
  selectedPermissions: Permission[] = [];

  readonly permissionGroups: PermissionGroup[] = [
    {
      label: 'Grupos',
      keys: [
        { key: 'Ver grupo',          value: PERMISSIONS.GROUP_VIEW    },
        { key: 'Ver grupos',         value: PERMISSIONS.GROUPS_VIEW   },
        { key: 'Editar grupo',       value: PERMISSIONS.GROUP_EDIT    },
        { key: 'Editar grupos',      value: PERMISSIONS.GROUPS_EDIT   },
        { key: 'Agregar grupo',      value: PERMISSIONS.GROUP_ADD     },
        { key: 'Agregar grupos',     value: PERMISSIONS.GROUPS_ADD    },
        { key: 'Eliminar grupo',     value: PERMISSIONS.GROUP_DELETE  },
        { key: 'Eliminar grupos',    value: PERMISSIONS.GROUPS_DELETE },
      ],
    },
    {
      label: 'Tickets',
      keys: [
        { key: 'Ver ticket',         value: PERMISSIONS.TICKET_VIEW       },
        { key: 'Ver tickets',        value: PERMISSIONS.TICKETS_VIEW      },
        { key: 'Ver todos',          value: PERMISSIONS.TICKET_VIEW_ALL   },
        { key: 'Editar ticket',      value: PERMISSIONS.TICKET_EDIT       },
        { key: 'Editar tickets',     value: PERMISSIONS.TICKETS_EDIT      },
        { key: 'Agregar ticket',     value: PERMISSIONS.TICKET_ADD        },
        { key: 'Agregar tickets',    value: PERMISSIONS.TICKETS_ADD       },
        { key: 'Eliminar ticket',    value: PERMISSIONS.TICKET_DELETE     },
        { key: 'Cambiar estado',     value: PERMISSIONS.TICKET_EDIT_STATE },
      ],
    },
    {
      label: 'Usuarios',
      keys: [
        { key: 'Ver usuario',        value: PERMISSIONS.USER_VIEW    },
        { key: 'Ver usuarios',       value: PERMISSIONS.USERS_VIEW   },
        { key: 'Editar usuario',     value: PERMISSIONS.USER_EDIT    },
        { key: 'Editar usuarios',    value: PERMISSIONS.USERS_EDIT   },
        { key: 'Agregar usuarios',   value: PERMISSIONS.USER_ADD     },
        { key: 'Eliminar usuarios',  value: PERMISSIONS.USER_DELETE  },
      ],
    },
  ];

  constructor(
    private usersStore: UsersStoreService,
    private msg: MessageService,
  ) {}

  ngOnInit() {
    this.users = ALL_USERS.map(u => ({
      username: u.username,
      area: u.area,
      permissions: this.usersStore.getPermissions(u.username),
    }));
  }

  openDialog(user: UserRow) {
    this.selectedUser = user;
    this.selectedPermissions = [...user.permissions];
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
    this.selectedUser = null;
  }

  isChecked(perm: Permission): boolean {
    return this.selectedPermissions.includes(perm);
  }

  togglePermission(perm: Permission) {
    if (this.isChecked(perm)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== perm);
    } else {
      this.selectedPermissions = [...this.selectedPermissions, perm];
    }
  }

  savePermissions() {
    if (!this.selectedUser) return;
    this.usersStore.updatePermissions(this.selectedUser.username, this.selectedPermissions);
    this.selectedUser.permissions = [...this.selectedPermissions];
    this.msg.add({
      severity: 'success',
      summary: 'Permisos actualizados',
      detail: `Se guardaron los permisos de ${this.selectedUser.username}.`,
    });
    this.closeDialog();
  }

  clearPermissions(user: UserRow) {
    this.usersStore.clearPermissions(user.username);
    user.permissions = [];
    this.msg.add({
      severity: 'warn',
      summary: 'Permisos eliminados',
      detail: `Se quitaron todos los permisos de ${user.username}.`,
    });
  }

  permissionCount(user: UserRow): number {
    return user.permissions.length;
  }

  isAdmin(user: UserRow): boolean {
    return user.username === 'admin';
  }
}
