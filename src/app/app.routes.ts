import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LeaveRequestDetailComponent } from './features/my-leave/detail/leave-request-detail.component';
import { LeaveRequestFormComponent } from './features/my-leave/form/leave-request-form.component';
import { MyLeaveListComponent } from './features/my-leave/list/my-leave-list.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      // remaining children added phase by phase from here
    ],
  },
  { path: '**', redirectTo: 'login' },
  {
  path: 'my-leave',
  canActivate: [roleGuard(['Employee', 'Manager'])],
  children: [
    { path: '', component: MyLeaveListComponent },
    { path: 'new', component: LeaveRequestFormComponent },
    { path: ':id', component: LeaveRequestDetailComponent },
    { path: ':id/edit', component: LeaveRequestFormComponent },
  ],
},
];