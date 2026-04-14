import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div class="toast toast-{{ notification.type }}">
          <div class="toast-icon">
            @switch (notification.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @case ('info') { ℹ }
            }
          </div>
          <div class="toast-content">
            <strong>{{ notification.title }}</strong>
            <p>{{ notification.message }}</p>
          </div>
          <button class="toast-close" (click)="removeNotification(notification.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }
    
    .toast {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 300px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideIn 0.3s ease;
    }
    
    .toast-success { border-left: 4px solid #22c55e; }
    .toast-error { border-left: 4px solid #ef4444; }
    .toast-warning { border-left: 4px solid #f59e0b; }
    .toast-info { border-left: 4px solid #3b82f6; }
    
    .toast-icon {
      font-size: 18px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .toast-success .toast-icon { background: #dcfce7; color: #16a34a; }
    .toast-error .toast-icon { background: #fee2e2; color: #dc2626; }
    .toast-warning .toast-icon { background: #fef3c7; color: #d97706; }
    .toast-info .toast-icon { background: #dbeafe; color: #2563eb; }
    
    .toast-content {
      flex: 1;
    }
    
    .toast-content strong {
      display: block;
      margin-bottom: 4px;
      color: #1f2937;
    }
    
    .toast-content p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    .toast-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    
    .toast-close:hover {
      color: #4b5563;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent {
  notificationService = inject(NotificationService);

  removeNotification(id: string): void {
    this.notificationService.remove(id);
  }
}