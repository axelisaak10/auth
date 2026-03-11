import { Injectable, signal } from '@angular/core';
import { Permission, PERMISSIONS } from './permissions';

// Bump version when the seed changes to force re-initialization
const STORE_KEY = 'user_permissions_store_v3';

export interface TimedPermission {
  value: Permission;
  expiresAt: string | null;   // ISO date string | null = permanente
}

type PermissionsStore = Record<string, TimedPermission[]>;

/** Permisos que TODOS los usuarios tienen siempre, sin importar lo almacenado */
const BASELINE: Permission[] = [
  PERMISSIONS.TICKET_VIEW,
  PERMISSIONS.TICKET_EDIT_STATE,
];

const perm = (v: Permission): TimedPermission => ({ value: v, expiresAt: null });

/**
 * Permisos iniciales por usuario — se aplican solo la primera vez
 * que corre la app (cuando localStorage está vacío).
 *
 * ──────────────────────────────────────────────────────────────────
 * ¿POR QUÉ TIENEN TODOS LOS PERMISOS superAdmin y admin?
 * ──────────────────────────────────────────────────────────────────
 * No existe un sistema de roles (no hay "rol admin" ni "rol user").
 * Los permisos se asignan uno por uno, directamente a cada usuario.
 *
 * superAdmin y admin reciben Object.values(PERMISSIONS) — es decir,
 * los 26 permisos existentes — de forma explícita en este SEED.
 * No los tienen por ser "admins", sino porque aquí se les asignaron
 * todos los permisos individualmente.
 *
 * Un administrador del sistema puede luego quitarles o agregarles
 * permisos concretos desde la vista "Gestión de Usuarios", sin
 * necesidad de cambiar ningún rol.
 *
 * Los usuarios normales (usuario1-3) arrancan solo con el BASELINE
 * (ver ticket, cambiar estado) y un admin puede ampliarles permisos.
 * ──────────────────────────────────────────────────────────────────
 */
const SEED: PermissionsStore = {
  // Reciben los 26 permisos existentes de forma individual
  superAdmin: (Object.values(PERMISSIONS) as Permission[]).map(perm),
  admin:      (Object.values(PERMISSIONS) as Permission[]).map(perm),
  // Arrancan solo con permisos mínimos; un admin puede ampliarlos
  usuario1:   BASELINE.map(perm),
  usuario2:   BASELINE.map(perm),
  usuario3:   BASELINE.map(perm),
};

@Injectable({ providedIn: 'root' })
export class UsersStoreService {
  private _store = signal<PermissionsStore>(this.loadStore());

  /** Permisos activos (no vencidos) — siempre incluye el baseline */
  getPermissions(username: string): Permission[] {
    const now = new Date();
    const stored = (this._store()[username] ?? [])
      .filter(tp => !tp.expiresAt || new Date(tp.expiresAt) > now)
      .map(tp => tp.value);
    // Garantizar baseline para todos
    return [...new Set([...BASELINE, ...stored])];
  }

  /** Permisos con su fecha de vencimiento — usado por el panel de edición */
  getTimedPermissions(username: string): TimedPermission[] {
    return this._store()[username] ?? BASELINE.map(perm);
  }

  /** Guarda permisos con fecha opcional */
  updateTimedPermissions(username: string, timed: TimedPermission[]): void {
    const updated = { ...this._store(), [username]: timed };
    this._store.set(updated);
    localStorage.setItem(STORE_KEY, JSON.stringify(updated));
  }

  /** Guarda permisos permanentes (sin fecha) */
  updatePermissions(username: string, permissions: Permission[]): void {
    this.updateTimedPermissions(username, permissions.map(perm));
  }

  /** Quita todos los permisos personalizados (queda solo el baseline) */
  clearPermissions(username: string): void {
    this.updateTimedPermissions(username, []);
  }

  private loadStore(): PermissionsStore {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown[]>;
        // Migración: si el formato antiguo era string[], convertir a TimedPermission[]
        const migrated: PermissionsStore = {};
        for (const [user, perms] of Object.entries(parsed)) {
          if (Array.isArray(perms) && perms.length > 0 && typeof perms[0] === 'string') {
            migrated[user] = (perms as string[]).map(v => ({ value: v as Permission, expiresAt: null }));
          } else {
            migrated[user] = perms as TimedPermission[];
          }
        }
        return migrated;
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(SEED));
      return structuredClone(SEED);
    } catch {
      return structuredClone(SEED);
    }
  }
}
