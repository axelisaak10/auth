import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';

// PrimeNG
import { TableModule }        from 'primeng/table';
import { ButtonModule }       from 'primeng/button';
import { DialogModule }       from 'primeng/dialog';
import { InputTextModule }    from 'primeng/inputtext';
import { PasswordModule }     from 'primeng/password';
import { DatePickerModule }   from 'primeng/datepicker';
import { SelectModule }       from 'primeng/select';
import { TagModule }          from 'primeng/tag';
import { ToastModule }        from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule }         from 'primeng/tabs';
import { InputNumberModule }  from 'primeng/inputnumber';
import { TextareaModule }     from 'primeng/textarea';
import { TooltipModule }      from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../auth/auth.service';

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

export interface AppUser {
  id:          number;
  fullName:    string;
  username:    string;
  initials:    string;
  avatarColor: string;
  email:       string;
  phone:       string;
  birthDate:   Date;
  role:        string;
  level:       string;
  author:      string;
  tickets:     number;
  description: string;
  status:      'active' | 'inactive';
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, DialogModule, InputTextModule,
    PasswordModule, DatePickerModule, SelectModule, TagModule,
    ToastModule, ConfirmDialogModule, TabsModule,
    InputNumberModule, TextareaModule, TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './analytics.component.html',
  styleUrls:  ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {

  activeTab = '0';

  users: AppUser[] = [
    { id:1, fullName:'Ana García',    username:'anagarcia',    initials:'AG', avatarColor:'#6366f1', email:'ana@gmail.com',     phone:'5512345670', birthDate:new Date('1995-04-12'), role:'Admin',  level:'Senior', author:'Equipo Alpha', tickets:12, description:'Administradora principal.',     status:'active'   },
    { id:2, fullName:'Carlos López',  username:'carloslopez',  initials:'CL', avatarColor:'#10b981', email:'carlos@gmail.com',  phone:'5512345671', birthDate:new Date('1992-08-20'), role:'Editor', level:'Mid',    author:'Equipo Beta',  tickets:7,  description:'Editor de contenido web.',      status:'active'   },
    { id:3, fullName:'María Torres',  username:'mariatorres',  initials:'MT', avatarColor:'#f59e0b', email:'maria@hotmail.com', phone:'5512345672', birthDate:new Date('1998-01-05'), role:'Viewer', level:'Junior', author:'Equipo Alpha', tickets:3,  description:'Soporte al cliente.',           status:'inactive' },
    { id:4, fullName:'Luis Martínez', username:'luismtz',      initials:'LM', avatarColor:'#ef4444', email:'luis@gmail.com',    phone:'5512345673', birthDate:new Date('1990-11-30'), role:'Editor', level:'Senior', author:'Equipo Beta',  tickets:9,  description:'Desarrollo de contenido.',      status:'active'   },
    { id:5, fullName:'Sofía Ramírez', username:'sofiaramirez', initials:'SR', avatarColor:'#8b5cf6', email:'sofia@outlook.com', phone:'5512345674', birthDate:new Date('1994-06-18'), role:'Admin',  level:'Senior', author:'Equipo Gamma', tickets:15, description:'Co-administradora del sistema.',status:'active'   },
    { id:6, fullName:'Pedro Sánchez', username:'pedrosanchez', initials:'PS', avatarColor:'#06b6d4', email:'pedro@gmail.com',   phone:'5512345675', birthDate:new Date('1997-03-22'), role:'Viewer', level:'Junior', author:'Equipo Gamma', tickets:2,  description:'Monitoreo de sistemas.',        status:'inactive' },
  ];

  filteredUsers: AppUser[] = [];
  globalFilter  = '';

  // Dialog
  dialogVisible = false;
  isEditing     = false;
  submitted     = false;
  editingUser: AppUser | null = null;

  form!: FormGroup;
  maxDate = new Date(new Date().setFullYear(new Date().getFullYear() - 18));
  pwFortaleza = 0;
  pwColor     = '#ef4444';

  roleOptions  = [
    { label: 'Admin',  value: 'Admin'  },
    { label: 'Editor', value: 'Editor' },
    { label: 'Viewer', value: 'Viewer' },
  ];
  levelOptions = [
    { label: 'Junior', value: 'Junior' },
    { label: 'Mid',    value: 'Mid'    },
    { label: 'Senior', value: 'Senior' },
  ];

  constructor(
    private fb:      FormBuilder,
    private msg:     MessageService,
    private confirm: ConfirmationService,
    public  auth:    AuthService
  ) {}

  ngOnInit() { this.filteredUsers = [...this.users]; }

  get f() { return this.form?.controls; }

  isInvalid(field: string) {
    return this.form.get(field)?.invalid &&
          (this.form.get(field)?.dirty || this.submitted);
  }

  // ── Stats ──────────────────────────────────────
  get totalUsers()    { return this.users.length; }
  get activeUsers()   { return this.users.filter(u => u.status === 'active').length; }
  get inactiveUsers() { return this.users.filter(u => u.status === 'inactive').length; }
  get totalTickets()  { return this.users.reduce((s, u) => s + u.tickets, 0); }

  // ── Filter ─────────────────────────────────────
  applyFilter() {
    const t = this.globalFilter.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.fullName.toLowerCase().includes(t) ||
      u.email.toLowerCase().includes(t)    ||
      u.role.toLowerCase().includes(t)
    );
  }

  // ── CRUD ───────────────────────────────────────
  openNew() {
    this.isEditing = false; this.editingUser = null;
    this.submitted = false; this.buildForm(null);
    this.dialogVisible = true;
  }

  openEdit(user: AppUser) {
    this.isEditing = true; this.editingUser = { ...user };
    this.submitted = false; this.buildForm(user);
    this.dialogVisible = true;
  }

  buildForm(u: AppUser | null) {
    this.form = this.fb.group({
      fullName:        [u?.fullName    || '', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      username:        [u?.username    || '', [Validators.required, Validators.minLength(3)]],
      email:           [u?.email       || '', [Validators.required, Validators.email, allowedDomain]],
      phone:           [u?.phone       || '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      birthDate:       [u?.birthDate   || null, Validators.required],
      role:            [u?.role        || 'Viewer', Validators.required],
      level:           [u?.level       || 'Junior', Validators.required],
      author:          [u?.author      || ''],
      tickets:         [u?.tickets     ?? 0, [Validators.required, Validators.min(0)]],
      description:     [u?.description || ''],
      password:        ['', passwordStrength],
      confirmPassword: [''],
    }, { validators: noCoinciden });
  }

  guardar() {
    this.submitted = true;
    const required = ['fullName','username','email','phone','birthDate','role','level'];
    if (required.some(f => this.form.get(f)?.invalid)) return;
    const pw = this.f['password'].value;
    if (pw && (this.form.get('password')?.invalid || this.form.errors?.['noCoinciden'])) return;

    const val = this.form.value;
    const initials = val.fullName.split(' ')
      .map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316'];

    if (this.isEditing && this.editingUser) {
      const idx = this.users.findIndex(u => u.id === this.editingUser!.id);
      this.users[idx] = { ...this.editingUser, ...val, initials };
      this.msg.add({ severity: 'success', summary: 'Actualizado', detail: `${val.fullName} fue editado.` });
    } else {
      this.users.push({
        id: Date.now(), initials,
        avatarColor: colors[this.users.length % colors.length],
        status: 'active', ...val
      });
      this.msg.add({ severity: 'success', summary: 'Creado', detail: `${val.fullName} fue registrado.` });
    }

    this.filteredUsers = [...this.users];
    this.dialogVisible = false;
  }

  toggleStatus(user: AppUser) {
    user.status = user.status === 'active' ? 'inactive' : 'active';
    this.msg.add({
      severity: user.status === 'active' ? 'info' : 'warn',
      summary: 'Estado cambiado',
      detail: `${user.fullName} ahora está ${user.status === 'active' ? 'activo' : 'inactivo'}.`
    });
  }

  deleteUser(user: AppUser) {
    this.confirm.confirm({
      message: `¿Eliminar a ${user.fullName}? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.users         = this.users.filter(u => u.id !== user.id);
        this.filteredUsers = [...this.users];
        this.msg.add({ severity: 'error', summary: 'Eliminado', detail: `${user.fullName} fue eliminado.` });
      }
    });
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
}