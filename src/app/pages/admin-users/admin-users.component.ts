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

import { AuthService, ALL_USERS } from '../../auth/auth.service';
import { UsersStoreService }      from '../../auth/users-store.service';
import { PERMISSIONS, Permission, ROLE_PERMISSIONS } from '../../auth/permissions';

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
        { key: 'Ver grupos',       value: PERMISSIONS.GROUP_VIEW   },
        { key: 'Editar grupos',    value: PERMISSIONS.GROUP_EDIT   },
        { key: 'Agregar grupos',   value: PERMISSIONS.GROUP_ADD    },
        { key: 'Eliminar grupos',  value: PERMISSIONS.GROUP_DELETE },
      ],
    },
    {
      label: 'Tickets',
      keys: [
        { key: 'Ver tickets',        value: PERMISSIONS.TICKET_VIEW       },
        { key: 'Ver todos',          value: PERMISSIONS.TICKET_VIEW_ALL   },
        { key: 'Editar tickets',     value: PERMISSIONS.TICKET_EDIT       },
        { key: 'Agregar tickets',    value: PERMISSIONS.TICKET_ADD        },
        { key: 'Eliminar tickets',   value: PERMISSIONS.TICKET_DELETE     },
        { key: 'Cambiar estado',     value: PERMISSIONS.TICKET_EDIT_STATE },
      ],
    },
    {
      label: 'Usuarios',
      keys: [
        { key: 'Ver usuario',      value: PERMISSIONS.USER_VIEW    },
        { key: 'Ver usuarios',     value: PERMISSIONS.USERS_VIEW   },
        { key: 'Editar usuarios',  value: PERMISSIONS.USER_EDIT    },
        { key: 'Agregar usuarios', value: PERMISSIONS.USER_ADD     },
        { key: 'Eliminar usuarios',value: PERMISSIONS.USER_DELETE  },
      ],
    },
  ];

  constructor(
    private auth: AuthService,
    private usersStore: UsersStoreService,
    private msg: MessageService,
  ) {}

  ngOnInit() {
    this.users = ALL_USERS
      .filter(u => u.role === 'user')
      .map(u => ({
        username: u.username,
        area: u.area,
        permissions: this.usersStore.getPermissions(u.username, u.role),
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

  resetToDefault(user: UserRow) {
    const defaults = ROLE_PERMISSIONS['user'];
    this.usersStore.updatePermissions(user.username, defaults);
    user.permissions = [...defaults];
    this.msg.add({
      severity: 'info',
      summary: 'Permisos restablecidos',
      detail: `${user.username} volvió a los permisos por defecto.`,
    });
  }

  permissionCount(user: UserRow): number {
    return user.permissions.length;
  }
}
