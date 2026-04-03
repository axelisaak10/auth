import { Component, signal, computed } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Toast } from 'primeng/toast';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
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
    DatePicker,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  maxDate = new Date();

  registerForm = new FormGroup(
    {
      usuario: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      nombreCompleto: new FormControl('', [Validators.required, Validators.minLength(3)]),
      telefono: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.minLength(10),
        Validators.maxLength(10),
      ]),
      direccion: new FormControl('', [Validators.required]),
      fechaNacimiento: new FormControl<Date | null>(null, [
        Validators.required,
        this.mayorDeEdadValidator,
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
        Validators.pattern(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: this.passwordsMatchValidator },
  );

  submitted = signal(false);

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.maxDate = new Date();
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordsMismatch: true };
    }
    return null;
  }

  mayorDeEdadValidator(control: AbstractControl): ValidationErrors | null {
    const fecha = control.value;
    if (!fecha) return null;
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesDiff = hoy.getMonth() - nacimiento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad >= 18 ? null : { menorDeEdad: true };
  }

  get f() {
    return this.registerForm.controls;
  }

  soloNumeros(event: KeyboardEvent): void {
    const charCode = event.key;
    if (!/^\d$/.test(charCode)) {
      event.preventDefault();
    }
  }

  onPegarTelefono(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const soloDigitos = pastedText.replace(/\D/g, '');
    this.registerForm.get('telefono')?.setValue(soloDigitos);
    this.registerForm.get('telefono')?.markAsTouched();
  }

  onRegister() {
    this.submitted.set(true);

    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        const control = this.registerForm.get(key);
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

    const val = this.registerForm.value;
    const userData = {
      nombre_completo: val.nombreCompleto,
      username: val.usuario,
      email: val.email,
      password: val.password,
      direccion: val.direccion,
      telefono: val.telefono,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_nacimiento: val.fechaNacimiento
        ? new Date(val.fechaNacimiento).toISOString().split('T')[0]
        : null,
    };

    this.authService.registerPublic(userData).subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Tu cuenta ha sido creada. Redirigiendo al inicio de sesión...',
          life: 2000,
        });
        this.registerForm.reset();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error en el registro',
          detail: err?.error?.message || 'No se pudo crear la cuenta. Verifica tus datos.',
          life: 5000,
        });
        console.error('Error al registrar:', err);
      },
    });
  }
}
