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
      {
        path: 'my-leave',
        canActivate: [roleGuard(['Employee', 'Manager'])],
        loadComponent: () =>
          import('./features/my-leave/list/my-leave-list.component').then(
            (m) => m.MyLeaveListComponent
          ),
      },
      {
        path: 'my-leave/new',
        canActivate: [roleGuard(['Employee', 'Manager'])],
        loadComponent: () =>
          import('./features/my-leave/form/leave-request-form.component').then(
            (m) => m.LeaveRequestFormComponent
          ),
      },
      {
        path: 'my-leave/:id',
        canActivate: [roleGuard(['Employee', 'Manager'])],
        loadComponent: () =>
          import('./features/my-leave/detail/leave-request-detail.component').then(
            (m) => m.LeaveRequestDetailComponent
          ),
      },
      {
        path: 'my-leave/:id/edit',
        canActivate: [roleGuard(['Employee', 'Manager'])],
        loadComponent: () =>
          import('./features/my-leave/form/leave-request-form.component').then(
            (m) => m.LeaveRequestFormComponent
          ),
      },
      {
        path: 'team-requests',
        canActivate: [roleGuard(['Manager'])],
        loadComponent: () =>
          import('./features/team-requests/team-requests.component').then(
            (m) => m.TeamRequestsComponent
          ),
      },
      {
        path: 'admin/requests',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/requests/admin-requests.component').then(
            (m) => m.AdminRequestsComponent
          ),
      },
      {
        path: 'admin/policies',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/policies/admin-policies.component').then(
            (m) => m.AdminPoliciesComponent
          ),
      },
      {
        path: 'admin/holidays',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/holidays/admin-holidays.component').then(
            (m) => m.AdminHolidaysComponent
          ),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/users/admin-users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'admin/participation-settings',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/admin/settings/admin-settings.component').then(
            (m) => m.AdminSettingsComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];