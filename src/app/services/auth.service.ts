import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface UserSession {
    email: string;
    nombre: string;
    rol: string;
    usuario: string;
    telefono: string;
    direccion: string;
    fechaNacimiento: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private readonly VALID_EMAIL = 'admin@seguridad.com';
    private readonly VALID_PASSWORD = 'Admin123!@';

    private readonly MOCK_USER: UserSession = {
        email: 'admin@seguridad.com',
        nombre: 'Carlos Administrador',
        rol: 'Admin',
        usuario: 'admin_carlos',
        telefono: '5512345678',
        direccion: 'Av. Reforma 123, Col. Centro, CDMX',
        fechaNacimiento: '1995-06-15',
    };

    private _isLoggedIn = signal(this.checkStorage());

    isLoggedIn = computed(() => this._isLoggedIn());

    constructor(private router: Router) { }

    login(email: string, password: string): boolean {
        if (email === this.VALID_EMAIL && password === this.VALID_PASSWORD) {
            localStorage.setItem('session', JSON.stringify(this.MOCK_USER));
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
        return data ? JSON.parse(data) : null;
    }

    private checkStorage(): boolean {
        return !!localStorage.getItem('session');
    }
}
