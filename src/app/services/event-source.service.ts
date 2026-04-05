import { Injectable, inject, NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EventSourceService {
  private eventSource: EventSource | null = null;
  private ngZone = inject(NgZone);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private onPermissionsUpdated: (() => void) | null = null;
  private shouldReconnect = true;

  setPermissionsCallback(callback: () => void): void {
    this.onPermissionsUpdated = callback;
  }

  connect(): void {
    if (this.eventSource || this.isConnecting) {
      return;
    }

    const token = this.getToken();
    if (!token) {
      return;
    }

    this.isConnecting = true;

    try {
      const eventSource = new EventSource(
        `http://localhost:3008/api/auth/events?token=${encodeURIComponent(token)}`,
        {
          withCredentials: true,
        }
      );

      eventSource.onopen = () => {
        this.ngZone.run(() => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
        });
      };

      eventSource.addEventListener('connected', (event) => {
        this.ngZone.run(() => {
          JSON.parse(event.data);
        });
      });

      eventSource.addEventListener('permissions-updated', (event) => {
        this.ngZone.run(() => {
          const data = JSON.parse(event.data);
          this.handlePermissionsUpdated(data);
        });
      });

      eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          this.handleError();
        });
      };

      this.eventSource = eventSource;
    } catch (err) {
      this.isConnecting = false;
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
    return null;
  }

  private handlePermissionsUpdated(data: any): void {
    if (this.onPermissionsUpdated) {
      this.onPermissionsUpdated();
    }
  }

  private handleError(): void {
    this.isConnecting = false;

    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnecting = false;
    }
  }

  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}
