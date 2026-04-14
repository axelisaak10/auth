import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./peges/landig/landig').then((m) => m.Landig),
  },
  {
    path: 'login',
    loadComponent: () => import('./peges/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./peges/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'register',
    loadComponent: () => import('./peges/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'home',
    loadComponent: () => import('./peges/layout/loyout/loyout').then((m) => m.Loyout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./peges/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'user',
        loadComponent: () => import('./peges/user/user').then((m) => m.User),
      },
      {
        path: 'group',
        loadComponent: () => import('./peges/group/group').then((m) => m.Group),
      },
      {
        path: 'admin-users',
        loadComponent: () => import('./peges/admin-users/admin-users').then((m) => m.AdminUsers),
      },
      {
        path: 'tickets',
        loadComponent: () => import('./peges/tickets/tickets').then((m) => m.Tickets),
      },
      {
        path: 'tickets/:groupId',
        loadComponent: () => import('./peges/tickets/tickets').then((m) => m.Tickets),
      },
    ],
  },
];
