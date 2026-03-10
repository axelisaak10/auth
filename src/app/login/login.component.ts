import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputText, Password, Button],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @Output() goToRegister = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();
  username = '';
  password = '';
  usernameError = '';
  passwordError = '';
  constructor(private msg: MessageService, private auth: AuthService) {}
  login() {
    this.usernameError = '';
    this.passwordError = '';
    let valid = true;
    if (!this.username.trim()) { this.usernameError = 'El usuario es requerido'; valid = false; }
    if (!this.password)        { this.passwordError = 'La contraseña es requerida'; valid = false; }
    if (!valid) {
      this.msg.add({ severity: 'warn', summary: 'Campos vacíos', detail: 'Completa todos los campos.' });
      return;
    }
    const ok = this.auth.login(this.username, this.password);
    if (ok) {
      const user = this.auth.currentUser();
      this.msg.add({ severity: 'success', summary: '¡Bienvenido!', detail: `Sesión iniciada como ${user?.username} (${user?.role})` });
      setTimeout(() => this.loginSuccess.emit(), 800);
    } else {
      this.usernameError = 'Usuario o contraseña incorrectos';
      this.passwordError = 'Usuario o contraseña incorrectos';
      this.msg.add({ severity: 'error', summary: 'Acceso denegado', detail: 'Las credenciales no son válidas.' });
    }
  }
}