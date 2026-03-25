import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./peges/landig/landig').then(m => m.Landig),
    },
    {
        path: 'login',
        loadComponent: () => import('./peges/auth/login/login').then(m => m.Login),
    },
    {
        path: 'register',
        loadComponent: () => import('./peges/auth/register/register').then(m => m.Register),
    },
    {
        path: 'home',
        loadComponent: () => import('./peges/layout/loyout/loyout').then(m => m.Loyout),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./peges/home/home').then(m => m.Home),
            },
            {
                path: 'user',
                loadComponent: () => import('./peges/user/user').then(m => m.User),
            },
            {
                path: 'group',
                loadComponent: () => import('./peges/group/group').then(m => m.Group),
            },
            {
<<<<<<< HEAD
                path: 'admin-users',
                loadComponent: () => import('./peges/admin-users/admin-users').then(m => m.AdminUsers),
=======
                path: 'dashboard-group',
                loadComponent: () => import('./peges/dashboard-group/dashboard-group').then(m => m.DashboardGroup),
            },
            {
                path: 'tickets',
                loadComponent: () => import('./peges/tickets/tickets').then(m => m.Tickets),
            },
            {
                path: 'gestion-user',
                loadComponent: () => import('./gestion-user/gestion-user').then(m => m.GestionUser),
>>>>>>> 9da5e22e8d381878948c234f5992eb16a820adfb
            },
        ],
    },
];
