import { Injectable, signal, computed, inject } from '@angular/core';
import { Permission } from './permissions';
import { UsersStoreService } from './users-store.service';

/**
 * Representa al usuario actualmente autenticado en la sesión.
 * Sus permisos son cargados desde UsersStoreService al iniciar sesión.
 */
export interface User {
  username:    string;       // Nombre de usuario único
  area:        string;       // Área o departamento al que pertenece
  permissions: Permission[]; // Lista de permisos activos (sin los vencidos)
}

/** Estructura interna de credenciales (solo usada para autenticación) */
interface Credential {
  username: string;
  password: string;
  area:     string;
}

/**
 * Lista de usuarios registrados en el sistema.
 * En producción esto vendría de una API/base de datos.
 *
 * ──────────────────────────────────────────────────────────────────
 * ¿POR QUÉ NO HAY ROLES AQUÍ?
 * ──────────────────────────────────────────────────────────────────
 * El sistema fue rediseñado para asignar permisos directamente
 * a cada usuario (permiso por permiso), en lugar de asignar un rol
 * genérico como "admin" o "user".
 *
 * Ventaja: dos usuarios pueden tener exactamente los permisos que
 * necesitan, sin que uno "herede" permisos que no le corresponden.
 *
 * Los permisos de cada usuario se guardan en UsersStoreService
 * (localStorage) y se cargan al hacer login. Si no existen permisos
 * guardados para un usuario, se aplica el SEED inicial definido
 * en users-store.service.ts.
 * ──────────────────────────────────────────────────────────────────
 *
 * Credenciales de prueba:
 *  - superAdmin / Super@2024!  → Tiene TODOS los permisos (SEED)
 *  - admin      / Admin@2024!  → Tiene TODOS los permisos (SEED)
 *  - usuario1   / User@1234#   → Solo permisos básicos de ticket (SEED)
 *  - usuario2   / User@2234#   → Solo permisos básicos de ticket (SEED)
 *  - usuario3   / User@3234#   → Solo permisos básicos de ticket (SEED)
 *
 * Los permisos se pueden modificar individualmente desde la vista
 * "Gestión de Usuarios" (admin/users) sin cambiar el "rol".
 */
const CREDENTIALS: Credential[] = [
  { username: 'superAdmin', password: 'Super@2024!', area: 'Super Administración' },
  { username: 'admin',      password: 'Admin@2024!', area: 'Administración'       },
  { username: 'usuario1',   password: 'User@1234#',  area: 'IT'                   },
  { username: 'usuario2',   password: 'User@2234#',  area: 'Desarrollo'           },
  { username: 'usuario3',   password: 'User@3234#',  area: 'Soporte'              },
];

/** Lista pública de todos los usuarios (sin contraseña) — usada en selects y tablas */
export const ALL_USERS = CREDENTIALS.map(c => ({ username: c.username, area: c.area }));

/** Clave bajo la que se guarda la sesión en sessionStorage */
const SESSION_KEY = 'auth_user';

/**
 * Servicio principal de autenticación.
 *
 * Responsabilidades:
 *  - Validar credenciales y crear la sesión de usuario.
 *  - Mantener el estado reactivo del usuario actual mediante Signals.
 *  - Persistir la sesión en sessionStorage para sobrevivir recargas.
 *  - Exponer `hasPermission()` para control de acceso en toda la app.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private usersStore = inject(UsersStoreService);

  /** Signal interno mutable — solo modificable dentro de este servicio */
  private _currentUser = signal<User | null>(this.loadSession());

  /** Signal de solo lectura para que los componentes lean el usuario actual */
  readonly currentUser = this._currentUser.asReadonly();

  /** Computed: true si hay un usuario autenticado, false si no */
  readonly isLoggedIn  = computed(() => this._currentUser() !== null);

  /**
   * Intenta autenticar con las credenciales dadas.
   * Si son válidas, construye el objeto User con sus permisos y guarda la sesión.
   * @returns true si el login fue exitoso, false si las credenciales son incorrectas.
   */
  login(username: string, password: string): boolean {
    const cred = CREDENTIALS.find(
      c => c.username === username.trim() && c.password === password
    );
    if (!cred) return false;

    const user: User = {
      username:    cred.username,
      area:        cred.area,
      // Los permisos se obtienen del store (soporta fechas de vencimiento)
      permissions: this.usersStore.getPermissions(cred.username),
    };

    this._currentUser.set(user);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  }

  /** Cierra la sesión: limpia el signal y elimina la clave de sessionStorage */
  logout(): void {
    this._currentUser.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  /**
   * Verifica si el usuario actual tiene un permiso específico.
   * @param permission  Valor del permiso a verificar (ej. 'ticket:view')
   * @returns true si el permiso está en la lista del usuario, false si no o si no hay sesión.
   */
  hasPermission(permission: Permission): boolean {
    return this._currentUser()?.permissions.includes(permission) ?? false;
  }

  /**
   * Intenta recuperar la sesión guardada en sessionStorage al arrancar la app.
   * Si el JSON está corrupto o no existe, devuelve null (no hay sesión).
   */
  private loadSession(): User | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
