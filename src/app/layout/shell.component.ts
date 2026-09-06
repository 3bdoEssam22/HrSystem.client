import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">HR Leave</div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          @if (auth.hasRole('Employee', 'Manager')) {
            <a routerLink="/my-leave" routerLinkActive="active">My Leave</a>
            <a routerLink="/participation" routerLinkActive="active">Participation</a>
          }
          @if (auth.hasRole('Manager')) {
            <a routerLink="/team-requests" routerLinkActive="active">Team Requests</a>
          }
          @if (auth.hasRole('Admin')) {
            <a routerLink="/admin/requests" routerLinkActive="active">All Requests</a>
            <a routerLink="/admin/policies" routerLinkActive="active">Policies</a>
            <a routerLink="/admin/holidays" routerLinkActive="active">Holidays</a>
            <a routerLink="/admin/users" routerLinkActive="active">Users</a>
            <a routerLink="/admin/participation-settings" routerLinkActive="active">Settings</a>
          }
        </nav>
        <div class="user-panel">
          <div class="user-name">{{ auth.currentUser()?.fullName }}</div>
          <div class="user-role">{{ auth.currentUser()?.role }}</div>
          <button type="button" (click)="logout()">Log out</button>
        </div>
      </aside>
      <main class="content"><router-outlet /></main>
    </div>
  `,
  styles: [`
    .shell { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; flex-shrink: 0; background: var(--color-surface); border-right: 1px solid var(--color-border);
               display: flex; flex-direction: column; padding: var(--space-4) var(--space-3); }
    .brand { font-family: var(--font-heading); font-size: 1.25rem; margin-bottom: var(--space-5); }
    nav { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
    nav a { padding: var(--space-2); border-radius: var(--radius); color: var(--color-ink-muted); text-decoration: none; font-size: 0.9375rem; }
    nav a.active { background: var(--color-bg); color: var(--color-ink); font-weight: 600; }
    .user-panel { border-top: 1px solid var(--color-border); padding-top: var(--space-3); margin-top: var(--space-3); }
    .user-name { font-weight: 600; }
    .user-role { font-size: 0.8125rem; color: var(--color-ink-muted); margin-bottom: var(--space-2); }
    .content { flex: 1; padding: var(--space-5); max-width: 960px; }
  `],
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}