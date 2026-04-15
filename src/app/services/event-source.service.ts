import { Injectable, inject, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventSourceService {
  private authEventSource: EventSource | null = null;
  private groupsEventSource: EventSource | null = null;
  private ticketsEventSource: EventSource | null = null;
  private ngZone = inject(NgZone);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private isConnecting = false;
  private onPermissionsUpdated: (() => void) | null = null;
  private onTicketNotification: ((type: string, data: any) => void) | null = null;
  private shouldReconnect = true;

  setPermissionsCallback(callback: () => void): void {
    this.onPermissionsUpdated = callback;
  }

  setTicketCallback(callback: (type: string, data: any) => void): void {
    this.onTicketNotification = callback;
  }

  connect(): void {
    this.connectToAuth();
    this.connectToGroups();
    this.connectToTickets();
  }

  private connectToAuth(): void {
    if (this.authEventSource || this.isConnecting) {
      return;
    }

    const token = this.getToken();
    if (!token) {
      return;
    }

    this.isConnecting = true;

    try {
      const eventSource = new EventSource(
        `${environment.apiGateway}/auth/events?token=${encodeURIComponent(token)}`,
        {
          withCredentials: true,
        },
      );

      eventSource.onopen = () => {
        this.ngZone.run(() => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          console.log('[SSE-Auth] Connected successfully');
        });
      };

      eventSource.addEventListener('connected', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Auth] Received connected event');
        });
      });

      eventSource.addEventListener('permissions-updated', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Auth] Received permissions-updated event');
          this.handlePermissionsUpdated(event);
        });
      });

      eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('[SSE-Auth] Connection error');
          this.handleAuthError();
        });
      };

      this.authEventSource = eventSource;
    } catch (err) {
      this.isConnecting = false;
      console.error('[SSE-Auth] Failed to create EventSource:', err);
    }
  }

  private connectToGroups(): void {
    const token = this.getToken();
    if (!token) {
      console.warn('[SSE-Groups] No token available');
      return;
    }

    try {
      const eventSource = new EventSource(
        `${environment.apiGateway}/groups/events?token=${encodeURIComponent(token)}`,
        {
          withCredentials: true,
        },
      );

      eventSource.onopen = () => {
        this.ngZone.run(() => {
          console.log('[SSE-Groups] Connected successfully');
        });
      };

      eventSource.addEventListener('connected', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Groups] Received connected event');
        });
      });

      eventSource.addEventListener('group-permissions-updated', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Groups] Received group-permissions-updated event');
          this.handlePermissionsUpdated(event);
        });
      });

      eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('[SSE-Groups] Connection error');
          this.handleGroupsError();
        });
      };

      this.groupsEventSource = eventSource;
    } catch (err) {
      console.error('[SSE-Groups] Failed to create EventSource:', err);
    }
  }

  private connectToTickets(): void {
    const token = this.getToken();
    if (!token) {
      console.warn('[SSE-Tickets] No token available');
      return;
    }

    try {
      const eventSource = new EventSource(
        `${environment.apiGateway}/tickets/events?token=${encodeURIComponent(token)}`,
        {
          withCredentials: true,
        },
      );

      eventSource.onopen = () => {
        this.ngZone.run(() => {
          console.log('[SSE-Tickets] Connected successfully');
        });
      };

      eventSource.addEventListener('connected', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Tickets] Received connected event');
        });
      });

      eventSource.addEventListener('ticket-created', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Tickets] Received ticket-created event');
          this.handleTicketEvent('ticket-created', event);
        });
      });

      eventSource.addEventListener('ticket-updated', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Tickets] Received ticket-updated event');
          this.handleTicketEvent('ticket-updated', event);
        });
      });

      eventSource.addEventListener('ticket-state-changed', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Tickets] Received ticket-state-changed event');
          this.handleTicketEvent('ticket-state-changed', event);
        });
      });

      eventSource.addEventListener('ticket-deleted', (event) => {
        this.ngZone.run(() => {
          console.log('[SSE-Tickets] Received ticket-deleted event');
          this.handleTicketEvent('ticket-deleted', event);
        });
      });

      eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('[SSE-Tickets] Connection error');
          this.handleTicketsError();
        });
      };

      this.ticketsEventSource = eventSource;
    } catch (err) {
      console.error('[SSE-Tickets] Failed to create EventSource:', err);
    }
  }

  private handlePermissionsUpdated(event: MessageEvent): void {
    if (this.onPermissionsUpdated) {
      console.log('[EventSource] Triggering permissions refresh');
      this.onPermissionsUpdated();
    }
  }

  private handleTicketEvent(type: string, event: MessageEvent): void {
    const data = JSON.parse(event.data);
    console.log(`[SSE-Tickets] Event ${type}:`, data);

    if (this.onTicketNotification) {
      this.onTicketNotification(type, data);
    }
  }

  private handleAuthError(): void {
    this.isConnecting = false;

    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[SSE-Auth] Reconnecting... attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connectToAuth(), this.reconnectDelay);
    }
  }

  private handleGroupsError(): void {
    if (this.shouldReconnect) {
      console.log('[SSE-Groups] Attempting to reconnect...');
      setTimeout(() => this.connectToGroups(), this.reconnectDelay);
    }
  }

  private handleTicketsError(): void {
    if (this.shouldReconnect) {
      console.log('[SSE-Tickets] Attempting to reconnect...');
      setTimeout(() => this.connectToTickets(), this.reconnectDelay);
    }
  }

  private getToken(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'Authentication') {
        return decodeURIComponent(value);
      }
    }
    return localStorage.getItem('_access_token');
  }

  disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.authEventSource) {
      this.authEventSource.close();
      this.authEventSource = null;
    }

    if (this.groupsEventSource) {
      this.groupsEventSource.close();
      this.groupsEventSource = null;
    }

    if (this.ticketsEventSource) {
      this.ticketsEventSource.close();
      this.ticketsEventSource = null;
    }

    this.isConnecting = false;
  }

  isConnected(): boolean {
    return (
      (this.authEventSource !== null && this.authEventSource.readyState === EventSource.OPEN) ||
      (this.groupsEventSource !== null && this.groupsEventSource.readyState === EventSource.OPEN) ||
      (this.ticketsEventSource !== null && this.ticketsEventSource.readyState === EventSource.OPEN)
    );
  }

  isAuthConnected(): boolean {
    return this.authEventSource !== null && this.authEventSource.readyState === EventSource.OPEN;
  }

  isGroupsConnected(): boolean {
    return this.groupsEventSource !== null && this.groupsEventSource.readyState === EventSource.OPEN;
  }

  isTicketsConnected(): boolean {
    return this.ticketsEventSource !== null && this.ticketsEventSource.readyState === EventSource.OPEN;
  }
}