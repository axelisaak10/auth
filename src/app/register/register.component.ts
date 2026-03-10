import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup,
  ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

function emailDomainValidator(c: AbstractControl): ValidationErrors | null {
  if (!c.value) return null;
  const email = c.value.toLowerCase();
  const allowed = ['@gmail.com', '@hotmail.com', '@outlook.com'];
  return allowed.some(d => email.endsWith(d)) ? null : { invalidDomain: true };
}

function telefonoDiezDigitos(c: AbstractControl): ValidationErrors | null {
  return (c.value && /^\d{10}$/.test(c.value)) ? null : { diezDigitos: true };
}

function mayorDeEdad(c: AbstractControl): ValidationErrors | null {
  if (!c.value) return null;
  const birth = new Date(c.value);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 18 ? null : { menorEdad: true };
}

function contrasenaSegura(c: AbstractControl): ValidationErrors | null {
  const v = c.value || '';
  const errors: any = {};
  if (v.length < 10) errors['minLen'] = true;
  if (!/[A-Z]/.test(v)) errors['sinMay'] = true;
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(v)) errors['sinSim'] = true;
  if (!/\d/.test(v)) errors['sinNum'] = true;
  return Object.keys(errors).length ? errors : null;
}

const confirmarPassValidator = (g: AbstractControl): ValidationErrors | null => {
  const p1 = g.get('password')?.value;
  const p2 = g.get('confirmPassword')?.value;
  return p1 === p2 ? null : { noCoinciden: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, DatePickerModule, ToastModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [MessageService]
})
export class RegisterComponent {
  @Output() goToLogin = new EventEmitter<void>();
  form: FormGroup;
  submitted = false;
  success = false;
  maxDate = new Date();
  pwFortaleza = 0;
  pwColor = '#e5e7eb';

  constructor(private fb: FormBuilder, private msg: MessageService) {
    this.form = this.fb.group({
      fullName:        ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      username:        ['', [Validators.required, Validators.minLength(3)]],
      email:           ['', [Validators.required, Validators.email, emailDomainValidator]],
      password:        ['', [Validators.required, contrasenaSegura]],
      confirmPassword: ['', Validators.required],
      birthDate:       [null, [Validators.required, mayorDeEdad]],
      phone:           ['', [Validators.required, telefonoDiezDigitos]],
    }, { validators: confirmarPassValidator });
  }

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || this.submitted));
  }

  onPasswordInput() {
    const v = this.f['password'].value || '';
    const checks = [v.length >= 10, /[A-Z]/.test(v), /\d/.test(v), /[!@#$%^&*()_+]/.test(v)];
    const score = checks.filter(Boolean).length;
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#10b981'];
    this.pwFortaleza = (score / 4) * 100;
    this.pwColor = score > 0 ? colors[score - 1] : '#e5e7eb';
  }

  filtrarNumeros(e: any) {
    const val = e.target.value.replace(/\D/g, '');
    this.form.patchValue({ phone: val }, { emitEvent: false });
  }

  registrar() {
    this.submitted = true;
    if (this.form.valid) {
      this.success = true;
      this.msg.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario registrado' });
    } else {
      this.msg.add({ severity: 'error', summary: 'Formulario Inválido', detail: 'Revisa los campos marcados en rojo' });
    }
  }

  volverAlLogin() { this.goToLogin.emit(); }
}