import { Injectable, signal } from '@angular/core';

export interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  members: string[];
}

const STORE_KEY = 'app_groups_v1';

const DEFAULT_GROUPS: Group[] = [
  {
    id: 'dev',
    name: 'Equipo Dev',
    description: 'Desarrollo de software y aplicaciones',
    icon: 'pi-code',
    color: '#6366f1',
    members: ['superAdmin', 'admin', 'usuario1', 'usuario2'],
  },
  {
    id: 'soporte',
    name: 'Soporte',
    description: 'Soporte técnico al cliente',
    icon: 'pi-headphones',
    color: '#10b981',
    members: ['superAdmin', 'admin', 'usuario2', 'usuario3'],
  },
  {
    id: 'ux',
    name: 'UX',
    description: 'Diseño y experiencia de usuario',
    icon: 'pi-palette',
    color: '#f59e0b',
    members: ['superAdmin', 'admin', 'usuario1'],
  },
];

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private _groups        = signal<Group[]>(this.load());
  private _selectedGroup = signal<Group | null>(null);

  readonly groups        = this._groups.asReadonly();
  readonly selectedGroup = this._selectedGroup.asReadonly();

  getGroupsForUser(username: string): Group[] {
    return this._groups().filter(g => g.members.includes(username));
  }

  selectGroup(group: Group | null): void {
    this._selectedGroup.set(group);
  }

  addGroup(group: Omit<Group, 'id'>): Group {
    const newGroup: Group = { ...group, id: Date.now().toString() };
    const updated = [...this._groups(), newGroup];
    this._groups.set(updated);
    this.save(updated);
    return newGroup;
  }

  updateGroup(group: Group): void {
    const updated = this._groups().map(g => g.id === group.id ? group : g);
    this._groups.set(updated);
    this.save(updated);
  }

  deleteGroup(id: string): void {
    const updated = this._groups().filter(g => g.id !== id);
    this._groups.set(updated);
    this.save(updated);
  }

  addMember(groupId: string, username: string): void {
    const updated = this._groups().map(g =>
      g.id === groupId && !g.members.includes(username)
        ? { ...g, members: [...g.members, username] }
        : g
    );
    this._groups.set(updated);
    this.save(updated);
  }

  removeMember(groupId: string, username: string): void {
    const updated = this._groups().map(g =>
      g.id === groupId
        ? { ...g, members: g.members.filter(m => m !== username) }
        : g
    );
    this._groups.set(updated);
    this.save(updated);
  }

  private load(): Group[] {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [...DEFAULT_GROUPS];
    } catch {
      return [...DEFAULT_GROUPS];
    }
  }

  private save(groups: Group[]): void {
    localStorage.setItem(STORE_KEY, JSON.stringify(groups));
  }
}
