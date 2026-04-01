export type Permission =
  | 'superadmin'
  | 'MANAGE_GROUPS'
  | 'MANAGE_BASIC_ADMINS'
  | 'MANAGE_USERS_GLOBAL'
  | 'VIEW_OWN_GROUP'
  | 'MANAGE_GROUP_USERS'
  | 'CREATE_TICKETS'
  | 'EDIT_TICKETS_ALL'
  | 'VIEW_OWN_TICKETS'
  | 'EDIT_TICKET_STATUS'
  | 'group:add'
  | 'group:edit'
  | 'group:delete'
  | 'group:view'
  | 'group:manage'
  | 'user:profile:view'
  | 'user:profile:edit'
  | 'user:add'
  | 'user:edit'
  | 'user:delete'
  | 'user:manage'
  | 'ticket:view'
  | 'ticket:add'
  | 'ticket:edit'
  | 'ticket:delete'
  | 'ticket:edit:state'
  | 'ticket:edit:comment'
  | 'ticket:manage';

export interface UserSession {
  email: string;
  nombre: string;
  usuario: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  permissions: Permission[];
  groupId?: string; // Optional, Super Admin might not have a group
}

export interface Group {
  id: string;
  name: string;
  description: string;
  adminId: string; // The user.usuario of the basic admin
  userIds: string[]; // List of user.usuario
}

export type TicketStatus = 'Pendiente' | 'En progreso' | 'Revisión' | 'Hecho';
export type TicketPriority =
  | 'Crítica'
  | 'Muy Alta'
  | 'Alta'
  | 'Media'
  | 'Baja'
  | 'Muy Baja'
  | 'Trivial';

export interface TicketComment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  userId: string;
  action: string; // e.g., "Changed status from Pendiente to En progreso"
  timestamp: string;
}

export interface Ticket {
  id: string;
  groupId: string;
  creadorId?: string; // user.usuario who created it
  titulo: string;
  descripcion: string;
  estado: TicketStatus;
  asignadoA: string; // user.usuario
  prioridad: TicketPriority;
  fechaCreacion: string;
  fechaLimite: string;
  comentarios: TicketComment[];
  historialCambios: TicketHistory[];
}
