import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule }   from 'primeng/dialog';
import { ButtonModule }   from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule }      from 'primeng/tag';
import { ToastModule }    from 'primeng/toast';
import { Toast }          from 'primeng/toast';

import { AuthService } from '../../auth/auth.service';
import { GroupsService, Group } from '../../services/groups.service';
import { PERMISSIONS } from '../../auth/permissions';
import { ALL_USERS } from '../../auth/auth.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, TagModule, ToastModule, Toast],
  providers: [MessageService],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
})
export class GroupsComponent implements OnInit {
  private auth   = inject(AuthService);
  private gs     = inject(GroupsService);
  private msg    = inject(MessageService);

  canAdd    = () => this.auth.hasPermission(PERMISSIONS.GROUPS_ADD)    || this.auth.hasPermission(PERMISSIONS.GROUP_ADD);
  canEdit   = () => this.auth.hasPermission(PERMISSIONS.GROUPS_EDIT)   || this.auth.hasPermission(PERMISSIONS.GROUP_EDIT);
  canDelete = () => this.auth.hasPermission(PERMISSIONS.GROUPS_DELETE) || this.auth.hasPermission(PERMISSIONS.GROUP_DELETE);

  readonly allUsers  = ALL_USERS;
  readonly groupList = this.gs.groups;

  dialogVisible  = false;
  isEditing      = false;
  editGroup: Partial<Group> & { id?: string } = {};
  addMemberInput = '';

  readonly iconOptions = [
    'pi-code','pi-headphones','pi-palette','pi-briefcase',
    'pi-chart-bar','pi-cog','pi-users','pi-desktop','pi-server',
  ];
  readonly colorOptions = [
    '#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#ec4899',
  ];

  ngOnInit() {}

  openNew() {
    this.isEditing  = false;
    this.editGroup  = { name: '', description: '', icon: 'pi-users', color: '#6366f1', members: [] };
    this.dialogVisible = true;
  }

  openEdit(g: Group) {
    this.isEditing  = true;
    this.editGroup  = { ...g, members: [...g.members] };
    this.dialogVisible = true;
  }

  save() {
    if (!this.editGroup.name?.trim()) return;
    if (this.isEditing && this.editGroup.id) {
      this.gs.updateGroup(this.editGroup as Group);
      this.msg.add({ severity: 'success', summary: 'Grupo actualizado', detail: this.editGroup.name });
    } else {
      this.gs.addGroup(this.editGroup as Omit<Group,'id'>);
      this.msg.add({ severity: 'success', summary: 'Grupo creado', detail: this.editGroup.name });
    }
    this.dialogVisible = false;
  }

  deleteGroup(g: Group) {
    this.gs.deleteGroup(g.id);
    this.msg.add({ severity: 'warn', summary: 'Grupo eliminado', detail: g.name });
  }

  addMember(groupId: string) {
    const u = this.addMemberInput.trim();
    if (!u) return;
    this.gs.addMember(groupId, u);
    this.addMemberInput = '';
    this.msg.add({ severity: 'info', summary: 'Miembro agregado', detail: u });
  }

  removeMember(groupId: string, username: string) {
    this.gs.removeMember(groupId, username);
  }

  onEditMemberSelect(event: Event) {
    const sel = event.target as HTMLSelectElement;
    const value = sel.value;
    if (value) { this.addMemberToEdit(value); sel.value = ''; }
  }

  addMemberToEdit(username: string) {
    if (!this.editGroup.members) this.editGroup.members = [];
    if (!this.editGroup.members.includes(username)) {
      this.editGroup.members = [...this.editGroup.members, username];
    }
  }

  removeMemberFromEdit(username: string) {
    this.editGroup.members = (this.editGroup.members ?? []).filter(m => m !== username);
  }
}
