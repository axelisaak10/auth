import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';

// PrimeNG
import { InputTextModule }   from 'primeng/inputtext';
import { PasswordModule }    from 'primeng/password';
import { ButtonModule }      from 'primeng/button';
import { DatePickerModule }  from 'primeng/datepicker';
import { ToastModule }       from 'primeng/toast';
import { TagModule }         from 'primeng/tag';
import { DividerModule }     from 'primeng/divider';
import { AvatarModule }      from 'primeng/avatar';
import { TextareaModule }    from 'primeng/textarea';
import { MessageService }    from 'primeng/api';

// ── Validators ────────────────────────────────────
function allowedDomain(c: AbstractControl): ValidationErrors | null {
  const val: string = c.value || '';
  const domain = val.split('@')[1];
  const allowed = ['gmail.com', 'hotmail.com', 'outlook.com'];
  return domain && !allowed.includes(domain) ? { invalidDomain: true } : null;
}

function passwordStrength(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value || '';
  if (!v) return null;
  const e: ValidationErrors = {};
  if (v.length < 10)           e['minLen'] = true;
  if (!/[!@#$%^&*]/.test(v))  e['sinSim'] = true;
  if (!/[A-Z]/.test(v))       e['sinMay'] = true;
  return Object.keys(e).length ? e : null;
}

function noCoinciden(g: AbstractControl): ValidationErrors | null {
  return g.get('password')?.value !== g.get('confirmPassword')?.value
    ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    InputTextModule, PasswordModule, ButtonModule,
    DatePickerModule, ToastModule, TagModule,
    DividerModule, AvatarModule, TextareaModule
  ],
  providers: [MessageService],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  form!: FormGroup;
  submitted  = false;
  editMode   = false;
  maxDate    = new Date(new Date().setFullYear(new Date().getFullYear() - 18));
  pwFortaleza = 0;
  pwColor     = '#ef4444';

  // Datos mock del usuario logueado
  currentUser = {
    fullName:    'Ana García',
    username:    'anagarcia',
    email:       'ana@gmail.com',
    phone:       '5512345678',
    birthDate:   new Date('1995-04-12'),
    role:        'Admin',
    level:       'Senior',
    author:      'Equipo Alpha',
    members:     ['Carlos López', 'María Torres', 'Luis Martínez'],
    tickets:     12,
    description: 'Administradora principal del sistema con acceso total a módulos de seguridad y gestión de usuarios.',
    status:      'active' as 'active' | 'inactive',
    avatarColor: '#6366f1',
    initials:    'AG',
    joinDate:    '15 Enero 2023',
  };

  constructor(private fb: FormBuilder, private msg: MessageService) {}

  ngOnInit() { this.buildForm(); }

  buildForm() {
    const u = this.currentUser;
    this.form = this.fb.group({
      fullName:        [u.fullName,  [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      username:        [u.username,  [Validators.required, Validators.minLength(3)]],
      email:           [u.email,     [Validators.required, Validators.email, allowedDomain]],
      phone:           [u.phone,     [Validators.required, Validators.pattern(/^\d{10}$/)]],
      birthDate:       [u.birthDate, Validators.required],
      description:     [u.description],
      password:        ['', passwordStrength],
      confirmPassword: [''],
    }, { validators: noCoinciden });
  }

  get f() { return this.form.controls; }

  isInvalid(field: string) {
    return this.form.get(field)?.invalid &&
          (this.form.get(field)?.dirty || this.submitted);
  }

  onPasswordInput() {
    const v: string = this.f['password'].value || '';
    let s = 0;
    if (v.length >= 10)       s += 25;
    if (/[A-Z]/.test(v))      s += 25;
    if (/[0-9]/.test(v))      s += 25;
    if (/[!@#$%^&*]/.test(v)) s += 25;
    this.pwFortaleza = s;
    this.pwColor = s <= 25 ? '#ef4444' : s <= 50 ? '#f59e0b' : s <= 75 ? '#3b82f6' : '#10b981';
  }

  filtrarNumeros(e: Event) {
    const input = e.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.form.get('phone')?.setValue(input.value);
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (!this.editMode) { this.submitted = false; this.buildForm(); }
  }

  guardar() {
    this.submitted = true;
    const required = ['fullName','username','email','phone','birthDate'];
    if (required.some(f => this.form.get(f)?.invalid)) return;
    const pw = this.f['password'].value;
    if (pw && (this.form.get('password')?.invalid || this.form.errors?.['noCoinciden'])) return;

    this.currentUser = {
      ...this.currentUser,
      fullName:    this.f['fullName'].value,
      username:    this.f['username'].value,
      email:       this.f['email'].value,
      phone:       this.f['phone'].value,
      birthDate:   this.f['birthDate'].value,
      description: this.f['description'].value,
    };

    this.editMode  = false;
    this.submitted = false;
    this.msg.add({ severity: 'success', summary: 'Perfil actualizado', detail: 'Cambios guardados correctamente.' });
  }
}