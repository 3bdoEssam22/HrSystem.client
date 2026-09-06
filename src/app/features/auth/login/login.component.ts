import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AppError } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <form class="login-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>HR Leave</h1>
        <p class="subtitle">Sign in to manage your leave.</p>

        @if (errorMessage()) { <div class="error-banner" role="alert">{{ errorMessage() }}</div> }

        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" autocomplete="username" />
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <span class="field-error">
            @if (form.controls.email.errors?.['required']) { Email is required. }
            @if (form.controls.email.errors?.['email']) { Enter a valid email address. }
          </span>
        }

        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" autocomplete="current-password" />
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <span class="field-error">Password is required.</span>
        }

        <button type="submit" [disabled]="loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</button>
      </form>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
    .login-card { width: 100%; max-width: 360px; background: var(--color-surface); border: 1px solid var(--color-border);
                  border-radius: var(--radius); padding: var(--space-5) var(--space-4); display: flex; flex-direction: column; }
    .login-card h1 { font-size: 1.5rem; margin-bottom: var(--space-1); }
    .subtitle { color: var(--color-ink-muted); margin: 0 0 var(--space-4); font-size: 0.9375rem; }
    label { font-size: 0.8125rem; font-weight: 600; margin-bottom: var(--space-1); }
    input { padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius); margin-bottom: var(--space-1); font-size: 0.9375rem; }
    .field-error { color: var(--color-danger); font-size: 0.8125rem; margin-bottom: var(--space-2); }
    .error-banner { background: var(--color-danger-bg); border: 1px solid var(--color-danger); color: var(--color-danger);
                    padding: var(--space-2); border-radius: var(--radius); font-size: 0.875rem; margin-bottom: var(--space-3); }
    button[type="submit"] { margin-top: var(--space-3); padding: var(--space-2); background: var(--color-accent); color: var(--color-accent-ink);
                            border: none; border-radius: var(--radius); font-size: 0.9375rem; font-weight: 600; cursor: pointer; }
    button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // surfaces every field's error even if the user tabbed past without blurring
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authService.setSession(response);
        this.router.navigate(['/dashboard']);
      },
      error: (appError: AppError) => {
        this.loading.set(false);
        this.errorMessage.set(appError.detail); // covers both auth.invalid_credentials and auth.account_inactive identically
      },
    });
  }
}