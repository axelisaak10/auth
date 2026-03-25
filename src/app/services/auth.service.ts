import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
<<<<<<< HEAD
import { Observable, tap } from 'rxjs';
import { Permission } from '../models/permission.model';

export interface UserSession {
    id: string;
    email: string;
    username: string;
    nombreCompleto: string;
    direccion?: string;
    telefono?: string;
    fecha_inicio?: string;
    fecha_nacimiento?: string;
    last_login?: string;
    permisos_globales?: Permission[];
    grupoId?: number;
}
=======
import { UserSession } from '../models/types';
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb

export const MICROSERVICES = {
    users: 'http://localhost:3444',
    groups: 'URL_PENDIENTE_GRUPOS',   // Microservicio de Grupos (En desarrollo)
    tickets: 'URL_PENDIENTE_TICKETS'  // Microservicio de Tickets (En desarrollo)
};

@Injectable({
    providedIn: 'root',
})
export class AuthService {

<<<<<<< HEAD
    // Endpoints correspondientes al microservicio de Usuarios/Auth
    private apiAuth = `${MICROSERVICES.users}/auth/login`;
    private apiRegister = `${MICROSERVICES.users}/auth/register`;
    private apiUsers = `${MICROSERVICES.users}/users`;
    private apiPermissions = `${MICROSERVICES.users}/permissions`;
=======
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
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb

    private _isLoggedIn = signal(this.checkStorage());

    isLoggedIn = computed(() => this  ._isLoggedIn());

    constructor(private router: Router, private http: HttpClient) { }

<<<<<<< HEAD
    login(credentials: any): Observable<any> {
        return this.http.post(this.apiAuth, credentials, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    console.warn('============= RESPONSE DEL BACKEND =============');
                    console.warn(response);
                    
                    // Si el backend envuelve en "data", extraerlo
                    const rawData = response.data || response;
                    
                    // Extraer el usuario donde sea que esté
                    const userData = rawData.user ? rawData.user : rawData;
                    
                    // Asegurar que nombreCompleto exista si el backend lo manda con guion bajo
                    if (userData.nombre_completo && !userData.nombreCompleto) {
                        userData.nombreCompleto = userData.nombre_completo;
                    }
                    
                    console.warn('============= lo que Angular Guardó en Session =============');
                    console.warn(userData);
                    
                    localStorage.setItem('session', JSON.stringify(userData));
                    this._isLoggedIn.set(true);
                })
            );
    }

    registerPublic(userData: any): Observable<any> {
        return this.http.post(this.apiRegister, userData, { withCredentials: true });
    }

    createUserByAdmin(userData: any): Observable<any> {
        return this.http.post(this.apiUsers, userData, { withCredentials: true });
    }

    getAllPermissions(): Observable<string[]> {
        return this.http.get<string[]>(this.apiPermissions, { withCredentials: true });
    }

    updateProfile(profileData: any): Observable<any> {
        return this.http.patch(`${this.apiUsers}/profile`, profileData, { withCredentials: true });
    }

    getAllUsers(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUsers, { withCredentials: true });
    }

    deleteUser(userId: string): Observable<any> {
        return this.http.delete(`${this.apiUsers}/${userId}`, { withCredentials: true });
    }

    updateUserByAdmin(userId: string, data: any): Observable<any> {
        return this.http.patch(`${this.apiUsers}/${userId}`, data, { withCredentials: true });
=======
    login(email: string, password: string): boolean {
        // Simple mock login: any email listed in MOCK_USERS with password 'Admin123!@' works
        const user = this.MOCK_USERS.find(u => u.email === email);
        if (user && password === 'Admin123!@') {
            localStorage.setItem('session', JSON.stringify(user));
            this._isLoggedIn.set(true);
            return true;
        }
        return false;
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
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
    