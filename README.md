# 🛡️ Seguridad — Sistema de Gestión de Seguridad

Aplicación web de gestión de seguridad desarrollada con **Angular 21** y **PrimeNG 21**. Implementa autenticación, autorización granular basada en permisos, gestión de grupos, usuarios y tickets con un tablero Kanban interactivo con drag-and-drop.

---

## 📑 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Ejecución](#-instalación-y-ejecución)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Sistema de Autenticación](#-sistema-de-autenticación)
- [Sistema de Permisos](#-sistema-de-permisos)
- [Módulos y Páginas](#-módulos-y-páginas)
- [Componentes Reutilizables](#-componentes-reutilizables)
- [Rutas y Navegación](#-rutas-y-navegación)
- [Características Principales](#-características-principales)

---

## 🧰 Tecnologías

| Tecnología | Versión | Descripción |
|---|---|---|
| **Angular** | 21.1.0 | Framework principal |
| **PrimeNG** | 21.1.1 | Librería de componentes UI |
| **PrimeIcons** | 7.0.0 | Iconografía |
| **@primeuix/themes (Aura)** | 2.0.3 | Tema visual |
| **TypeScript** | 5.9.2 | Lenguaje |
| **RxJS** | 7.8.x | Programación reactiva |
| **Vitest** | 4.0.8 | Testing |

---

## 📋 Requisitos Previos

- **Node.js** 18+ y **npm** 11+
- **Angular CLI** 21+

---

## 🚀 Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Seguridad

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
ng serve

# 4. Abrir en navegador
# http://localhost:4200
```

### Otros comandos

```bash
# Compilar para producción
ng build

# Ejecutar pruebas unitarias
ng test
```

---

## 🏗️ Arquitectura del Proyecto

```
src/app/
├── app.ts                    # Componente raíz (RouterOutlet)
├── app.config.ts             # Configuración global (Router, PrimeNG Aura)
├── app.routes.ts             # Definición de rutas con lazy loading
│
├── models/
│   └── permission.model.ts   # Tipos y constantes de permisos
│
├── services/
│   ├── auth.service.ts       # Autenticación (login, logout, sesión)
│   └── permission.service.ts # Evaluación de permisos del usuario
│
├── guards/
│   └── auth.guard.ts         # Guard de protección de rutas
│
├── directives/
│   ├── has-permission.directive.ts  # Directiva estructural *appHasPermission
│   └── index.ts                     # Barrel export
│
├── components/
│   └── sidebar/              # Sidebar con menú filtrado por permisos
│
├── boton/                    # Componente de botón personalizado
│
└── peges/
    ├── landig/               # Landing page (página de inicio pública)
    ├── auth/
    │   ├── login/            # Inicio de sesión con formulario reactivo
    │   └── register/         # Registro con validaciones avanzadas
    ├── layout/
    │   └── loyout/           # Layout principal (navbar + sidebar + router-outlet)
    ├── home/                 # Dashboard con estadísticas y actividad reciente
    ├── user/                 # Perfil de usuario y tickets asignados
    └── group/                # Gestión de grupos, miembros y Kanban de tickets
```

---

## 🔐 +Sistema de Autenticación

### `AuthService` (`services/auth.service.ts`)

Gestiona la autenticación mediante **usuarios simulados (mock)** y **localStorage** para persistir la sesión.

#### Usuarios de prueba

| Email | Contraseña | Rol | Descripción |
|---|---|---|---|
| `admin@seguridad.com` | `Admin123!@` | Admin | Acceso total a todos los módulos |
| `usuario@seguridad.com` | `User1234!@` | Usuario | Acceso limitado, pertenece al grupo 1 |

#### Interfaz `UserSession`

```typescript
interface UserSession {
  email: string;
  nombre: string;
  rol: string;
  usuario: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  permisos: Permission[];    // Permisos granulares asignados
  grupoId: number | null;    // Grupo al que pertenece (null si es admin global)
}
```

#### Métodos principales

| Método | Descripción |
|---|---|
| `login(email, password)` | Valida credenciales y guarda sesión en localStorage |
| `logout()` | Elimina sesión y redirige a `/login` |
| `getUser()` | Retorna el `UserSession` actual o `null` |
| `isLoggedIn` | Signal computado, reactivo |

### `AuthGuard` (`guards/auth.guard.ts`)

Guard funcional (`CanActivateFn`) que protege las rutas bajo `/home`. Si el usuario no está autenticado, redirige a `/login`.

---

## 🔑 Sistema de Permisos

La aplicación **no usa roles para el control de acceso**. En su lugar emplea un sistema **100% basado en permisos granulares**. Cada usuario tiene un arreglo `permisos: Permission[]` que determina exactamente qué puede ver y hacer.

### `Permission` (`models/permission.model.ts`)

Define un **union type** de permisos como strings literales:

```typescript
type Permission =
  | 'groups_view' | 'group_view' | 'groups_edit' | 'group_edit'
  | 'groups_delete' | 'group_delete' | 'groups_add' | 'group_add'
  | 'user_view' | 'users_view' | 'users_edit' | 'user_edit'
  | 'user_delete' | 'user_add'
  | 'ticket_view' | 'tickets_view' | 'tickets_edit' | 'ticket_edit'
  | 'ticket_delete' | 'ticket_add' | 'tickets_add'
  | 'ticket_edit_state';
```

#### Convención de nombres

| Patrón | Significado |
|---|---|
| `groups_*` (plural) | Permiso de administrador (todos los grupos) |
| `group_*` (singular) | Permiso de usuario normal (solo su grupo) |
| `ticket_edit_state` | Permiso especial: solo puede cambiar el estado del ticket |

#### Constantes agrupadas

```typescript
GRUPO_PERMISSIONS   → ['group_view', 'group_edit', 'group_add', 'group_delete']
TICKET_PERMISSIONS  → ['ticket_view', 'ticket_edit', 'ticket_add', 'ticket_delete', 'ticket_edit_state']
USER_PERMISSIONS    → ['user_view', 'users_view', 'user_edit', 'user_add', 'user_delete']
```

### `PermissionService` (`services/permission.service.ts`)

Servicio inyectable global que evalúa permisos del usuario actual:

| Método | Descripción |
|---|---|
| `hasPermission(p)` | ¿Tiene **exactamente** este permiso? |
| `hasAnyPermission(...p)` | ¿Tiene **al menos uno** de estos permisos? |

### `*appHasPermission` — Directiva Estructural (`directives/has-permission.directive.ts`)

Directiva que muestra u oculta elementos del DOM según permisos:

```html
<!-- Un solo permiso -->
<button *appHasPermission="'ticket_add'">Nuevo Ticket</button>

<!-- Cualquiera de varios permisos (OR) -->
<ng-container *appHasPermission="['groups_view', 'group_view']">
  ...contenido visible si tiene alguno...
</ng-container>
```

### Resumen: Admin vs Usuario

| Funcionalidad | Admin (`admin@seguridad.com`) | Usuario (`usuario@seguridad.com`) |
|---|---|---|
| Ver todos los grupos | ✅ (`groups_view`) | ❌ |
| Ver su propio grupo | ✅ | ✅ (`group_view`) |
| Crear/editar/eliminar grupos | ✅ | ❌ |
| Editar tickets (completo) | ✅ (`ticket_edit`) | ❌ |
| Cambiar estado de tickets | ✅ | ✅ (`ticket_edit_state`) |
| Drag & Drop en Kanban | ✅ | ✅ |
| Agregar/eliminar miembros | ✅ | ❌ |
| Editar su perfil | ✅ | ✅ (`user_edit`) |

---

## 📄 Módulos y Páginas

### 1. Landing Page (`peges/landig/`)

Página de inicio pública visible sin autenticación. Contiene botones para navegar al login y registro.

- **Ruta:** `/`

---

### 2. Login (`peges/auth/login/`)

Formulario de inicio de sesión con **Reactive Forms**.

- **Ruta:** `/login`
- **Validaciones:**
  - Email: requerido, formato email válido
  - Contraseña: requerida, mínimo 6 caracteres, máximo 10
- **Feedback:** Toast notifications de PrimeNG para éxito/error
- **Post-login:** Redirección automática a `/home`

---

### 3. Registro (`peges/auth/register/`)

Formulario de registro con validaciones avanzadas.

- **Ruta:** `/register`
- **Campos:** usuario, email, nombre completo, teléfono, dirección, fecha de nacimiento, contraseña, confirmar contraseña
- **Validaciones:**
  - Teléfono: exactamente 10 dígitos numéricos (con filtro de pegado)
  - Fecha de nacimiento: mayor de 18 años
  - Contraseña: exactamente 10 caracteres, al menos un carácter especial
  - Confirmar contraseña: debe coincidir con la contraseña
- **Validador personalizado:** `mayorDeEdadValidator` y `passwordsMatchValidator`

---

### 4. Layout Principal (`peges/layout/loyout/`)

Contenedor que envuelve las páginas protegidas. Incluye:

- **Navbar superior** con nombre de usuario, avatar, botón de menú y botón de logout
- **Sidebar** colapsable (controlado por signal)
- **Router Outlet** para las páginas hijas

---

### 5. Dashboard / Home (`peges/home/`)

Página principal del usuario autenticado.

- **Ruta:** `/home`
- **Contenido:**
  - Saludo personalizado con nombre del usuario
  - 4 tarjetas de estadísticas: Usuarios Activos, Sesiones Hoy, Incidentes, Uptime
  - Tabla de actividad reciente (datos mock)

---

### 6. Perfil de Usuario (`peges/user/`)

Vista del perfil del usuario actual con funcionalidades de edición.

- **Ruta:** `/home/user`
- **Funcionalidades:**
  - Visualización de datos personales (nombre, email, teléfono, dirección, fecha de nacimiento)
  - Edición de perfil (modal con los mismos campos editables)
  - Suspender / reactivar cuenta
  - **Tickets asignados:** tabla con los tickets del grupo del usuario
  - **Editar estado de ticket** (si tiene permiso `ticket_edit_state`): modal de cambio rápido de estado
  - Historial de cambios en cada ticket

---

### 7. Gestión de Grupos (`peges/group/`)

Módulo principal de administración con tabla de grupos y tablero Kanban de tickets.

- **Ruta:** `/home/group`

#### Tabla de Grupos
- Columnas: Nivel, Autoridad, Nombre, Integrantes, Tickets, Descripción, Acciones
- Paginación configurable (5, 10, 20 por página)
- Ordenamiento por columnas
- **Acciones** (según permisos): Editar grupo, Eliminar grupo, Agregar persona, Ver/Eliminar persona, Crear ticket

#### Gestión de Miembros
- Panel expandible por grupo
- Grid de tarjetas con avatar, nombre, email y rol
- Agregar nuevos miembros (modal)
- Eliminar miembros (con confirmación)

#### Tablero Kanban de Tickets
- **4 columnas de estado:** Pendiente, En progreso, Revisión, Finalizado
- Tarjetas con: título, descripción, prioridad (con color), asignado a, fecha límite
- **Drag & Drop nativo (HTML5):** arrastrar un ticket a otra columna cambia su estado automáticamente y registra el cambio en el historial
- Indicadores visuales: cursor grab, opacidad al arrastrar, columna destino resaltada
- **Vista Admin:** edición completa y eliminación de tickets
- **Vista Usuario:** solo cambio de estado (botón o drag-and-drop)
- **Responsive móvil:** scroll horizontal con snap para navegar entre columnas en pantallas pequeñas

#### Diálogos
- Crear/Editar grupo
- Crear/Editar ticket (admin)
- Cambiar estado de ticket (usuario)
- Agregar usuario al grupo
- Confirmación de eliminación

---

## 🧩 Componentes Reutilizables

### Sidebar (`components/sidebar/`)

Menú lateral de navegación con filtrado dinámico por permisos.

```typescript
menuItems: MenuItem[] = [
  { label: 'Dashboard',     icon: 'pi pi-home',      route: '/home' },
  { label: 'Usuarios',      icon: 'pi pi-users',     route: '/home/user',  permissions: ['user_view', 'users_view'] },
  { label: 'Grupos',        icon: 'pi pi-th-large',  route: '/home/group', permissions: ['groups_view', 'group_view'] },
  { label: 'Reportes',      icon: 'pi pi-chart-bar', route: '/home' },
  { label: 'Configuración', icon: 'pi pi-cog',       route: '/home' },
];
```

- Los ítems con `permissions` solo se muestran si el usuario tiene al menos uno de los permisos listados
- Los ítems sin `permissions` son visibles para todos
- Tiene overlay para cerrar en móvil
- Animaciones con PrimeNG Ripple

---

## 🗺️ Rutas y Navegación

Todas las rutas usan **lazy loading** (`loadComponent`) para optimizar la carga:

```
/                  → Landing Page (pública)
/login             → Login (pública)
/register          → Registro (pública)
/home              → Layout + Dashboard (protegida con authGuard)
/home/user         → Perfil de Usuario (protegida)
/home/group        → Gestión de Grupos (protegida)
```

Las rutas bajo `/home` están protegidas por el `authGuard`. El layout (`Loyout`) actúa como contenedor padre con sidebar y navbar.

---

## ✨ Características Principales

- **🔒 Autenticación simulada** con localStorage y signals reactivos
- **🎯 Permisos granulares** sin roles — control fino por acción
- **📋 Directiva `*appHasPermission`** para control visual en templates
- **🏗️ Lazy loading** en todas las rutas para rendimiento óptimo
- **🎨 Tema Aura de PrimeNG** con estilos personalizados y gradientes
- **📱 Diseño responsive** adaptado a desktop, tablet y móvil
- **🖱️ Drag & Drop nativo** en tablero Kanban para cambio de estado
- **📜 Historial de cambios** automático en tickets
- **🧩 Componentes PrimeNG:** Table, Dialog, Toolbar, Tag, Select, DatePicker, Toast, Card, Avatar, y más
- **✅ Formularios reactivos** con validaciones personalizadas (mayor de edad, contraseñas)
- **🔔 Feedback visual** con Toast notifications y confirmaciones

---

## 📝 Licencia

Proyecto académico — uso educativo.
