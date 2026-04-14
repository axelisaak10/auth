import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _notifications = signal<Notification[]>([]);
  notifications = this._notifications.asReadonly();

  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    this._notifications.update(list => [newNotification, ...list]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.remove(newNotification.id);
    }, 5000);
  }

  success(title: string, message: string): void {
    this.add({ type: 'success', title, message });
  }

  error(title: string, message: string): void {
    this.add({ type: 'error', title, message });
  }

  info(title: string, message: string): void {
    this.add({ type: 'info', title, message });
  }

  warning(title: string, message: string): void {
    this.add({ type: 'warning', title, message });
  }

  remove(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  clear(): void {
    this._notifications.set([]);
  }

  // Helper for ticket notifications
  ticketCreated(titulo: string): void {
    this.success('Nuevo Ticket', `Se creó el ticket: ${titulo}`);
  }

  ticketUpdated(titulo: string): void {
    this.info('Ticket Actualizado', `Cambios en: ${titulo}`);
  }

  ticketStateChanged(titulo: string, nuevoEstado?: string): void {
    const message = nuevoEstado 
      ? `Estado cambiado a: ${nuevoEstado}` 
      : `El ticket ${titulo} ha cambiado de estado`;
    this.info('Estado del Ticket', message);
  }

  ticketDeleted(id: string): void {
    this.warning('Ticket Eliminado', `El ticket fue eliminado`);
  }

  // Permission notifications
  permissionsUpdated(): void {
    this.info('Permisos Actualizados', 'Tus permisos han sido actualizados');
  }
}