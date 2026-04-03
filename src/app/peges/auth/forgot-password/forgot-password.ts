import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Button, InputText, Card, Message, Toast],
  providers: [MessageService],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  forgotForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  submitted = signal(false);
  isLoading = signal(false);
  emailSent = signal(false);

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
  ) {}

  get f() {
    return this.forgotForm.controls;
  }

  onSubmit() {
    this.submitted.set(true);

    if (this.forgotForm.invalid) {
      Object.keys(this.forgotForm.controls).forEach((key) => {
        const control = this.forgotForm.get(key);
        control?.markAsTouched();
        control?.markAsDirty();
      });

      this.messageService.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Por favor ingresa un correo electrónico válido.',
        life: 4000,
      });
      return;
    }

    this.isLoading.set(true);
    const email = this.forgotForm.value.email!;

    this.authService.forgotPassword(email).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.emailSent.set(true);

        this.messageService.add({
          severity: 'success',
          summary: 'Correo enviado',
          detail: 'Se envió a su correo la recuperación de cuenta',
          life: 5000,
        });

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al procesar la solicitud.',
          life: 4000,
        });
      },
    });
  }
}
