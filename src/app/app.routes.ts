import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'participation',
        canActivate: [roleGuard(['Employee', 'Manager'])],
        loadComponent: () =>
          import('./features/participation/participation.component').then(
            (m) => m.ParticipationComponent
          ),
      },
      // --- Placeholders for remaining features so clicking sidebar links never 404s ---
      {
        path: 'my-leave',
        canActivate: [roleGuard(['Employee', 'Manager'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'team-requests',
        canActivate: [roleGuard(['Manager'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin/requests',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin/policies',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin/holidays',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'admin/participation-settings',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard', // Any unknown route stays inside the authenticated app
  },
];