import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

export const MICROSERVICES = {
    users: 'https://back-end-users.vercel.app',
    groups: 'URL_PENDIENTE_GRUPOS',
    tickets: 'URL_PENDIENTE_TICKETS'
};

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private apiAuth = `${MICROSERVICES.users}/auth/login`;
    private apiRegister = `${MICROSERVICES.users}/auth/register`;
    private apiUsers = `${MICROSERVICES.users}/users`;
    private apiPermissions = `${MICROSERVICES.users}/permissions`;

    private _isLoggedIn = signal(this.checkStorage());

    isLoggedIn = computed(() => this._isLoggedIn());

    constructor(private router: Router, private http: HttpClient) { }

    login(credentials: any): Observable<any> {
        return this.http.post(this.apiAuth, credentials, { withCredentials: true })
            .pipe(
                tap((response: any) => {
                    const rawData = response.data || response;
                    const userData = rawData.user ? rawData.user : rawData;
                    if (userData.nombre_completo && !userData.nombreCompleto) {
                        userData.nombreCompleto = userData.nombre_completo;
                    }
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
    }

    logout(): void {
        localStorage.removeItem('session');
        this._isLoggedIn.set(false);
        this.router.navigate(['/login']);
    }

    getUser(): UserSession | null {
        const data = localStorage.getItem('session');
        return data ? JSON.parse(data) : null;
    }

    private checkStorage(): boolean {
        return !!localStorage.getItem('session');
    }
}
