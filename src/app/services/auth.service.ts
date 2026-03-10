import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { UserSession } from '../models/types';

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private readonly MOCK_USERS: UserSession[] = [
        {
            email: 'superadmin@seguridad.com',
            nombre: 'Super Administrador',
            usuario: 'super_admin',
            telefono: '5512345678',
            direccion: 'Sede Central',
            fechaNacimiento: '1980-01-01',
            permissions: ['MANAGE_GROUPS', 'MANAGE_BASIC_ADMINS', 'MANAGE_USERS_GLOBAL', 'VIEW_OWN_GROUP']
        },
        {
            email: 'admin@seguridad.com',
            nombre: 'Carlos Admin Básico',
            usuario: 'admin_carlos',
            telefono: '5512345679',
            direccion: 'Sucursal Norte',
            fechaNacimiento: '1995-06-15',
            groupId: 'group-1',
            permissions: ['VIEW_OWN_GROUP', 'MANAGE_GROUP_USERS', 'CREATE_TICKETS', 'EDIT_TICKETS_ALL', 'VIEW_OWN_TICKETS', 'group:add', 'group:edit', 'group:delete']
        },
        {
            email: 'user@seguridad.com',
            nombre: 'Normal Usuario',
            usuario: 'normal_user',
            telefono: '5512345680',
            direccion: 'Remoto',
            fechaNacimiento: '2000-01-01',
            groupId: 'group-1',
            permissions: ['VIEW_OWN_GROUP', 'VIEW_OWN_TICKETS', 'EDIT_TICKET_STATUS']
        }
    ];

    private _isLoggedIn = signal(this.checkStorage());

    isLoggedIn = computed(() => this._isLoggedIn());

    constructor(private router: Router) { }

    login(email: string, password: string): boolean {
        // Simple mock login: any email listed in MOCK_USERS with password 'Admin123!@' works
        const user = this.MOCK_USERS.find(u => u.email === email);
        if (user && password === 'Admin123!@') {
            localStorage.setItem('session', JSON.stringify(user));
            this._isLoggedIn.set(true);
            return true;
        }
        return false;
    }

    logout(): void {
        localStorage.removeItem('session');
        this._isLoggedIn.set(false);
        this.router.navigate(['/login']);
    }

    getUser(): UserSession | null {
        const data = localStorage.getItem('session');
        if (data) {
            const parsed = JSON.parse(data) as UserSession;
            // Sync permissions with mock data just in case of hot-reload or cached sessions
            const mock = this.MOCK_USERS.find(u => u.email === parsed.email);
            if (mock) {
                parsed.permissions = mock.permissions;
                parsed.groupId = mock.groupId; // Sync group as well
            }
            return parsed;
        }
        return null;
    }

    private checkStorage(): boolean {
        return !!localStorage.getItem('session');
    }
}
