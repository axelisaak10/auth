import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    Button,
    InputText,
    Password,
    Card,
    Message,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]),
  });

  submitted = signal(false);

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
  ) { }

  get f() {
    return this.loginForm.controls;
  }

  onLogin() {
    this.submitted.set(true);

    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
        control?.markAsDirty();
      });

      this.messageService.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Por favor corrige los errores antes de continuar.',
        life: 4000,
      });
      return;
    }

    const email = this.loginForm.value.email!;
    const password = this.loginForm.value.password!;

    this.authService.login({ email, password }).subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Bienvenido!',
          detail: 'Inicio de sesión exitoso.',
          life: 2000,
        });

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 800);
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Credenciales incorrectas',
          detail: 'El correo o la contraseña no son válidos.',
          life: 4000,
        });
      }
    });
  }
}
