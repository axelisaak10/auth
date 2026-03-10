import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem">
      <h1>Ajustes</h1>
      <p>Configuración del sistema</p>
    </div>
  `
})
export class SettingsComponent {}