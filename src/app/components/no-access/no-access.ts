import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-no-access',
  imports: [CommonModule, Card],
  template: `
    <div class="no-access-container">
      <p-card styleClass="no-access-card">
        <div class="no-access-content">
          <i class="pi pi-lock no-access-icon"></i>
          <h3>No tienes acceso</h3>
          <p>{{ message() }}</p>
        </div>
      </p-card>
    </div>
  `,
  styles: [
    `
      .no-access-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 2rem;
      }

      .no-access-card {
        max-width: 400px;
        text-align: center;
      }

      .no-access-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
      }

      .no-access-icon {
        font-size: 4rem;
        color: var(--red-500);
      }

      .no-access-content h3 {
        margin: 0;
        color: var(--surface-900);
      }

      .no-access-content p {
        margin: 0;
        color: var(--surface-600);
      }
    `,
  ],
})
export class NoAccessComponent {
  message = input<string>('No tienes acceso a esta sección. Contacta al administrador.');
}
