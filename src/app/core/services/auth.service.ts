import { Injectable, computed, signal } from '@angular/core';
import { CurrentUser, LoginResponse, UserRole } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'hr_leave_token';
  private readonly userKey = 'hr_leave_user';

  // Seeded from sessionStorage at construction time, not just set on login — otherwise an F5
  // refresh would read as logged-out even though a valid token is still sitting in storage.
  private readonly _currentUser = signal<CurrentUser | null>(this.readStoredUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  get token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  setSession(response: LoginResponse): void {
    sessionStorage.setItem(this.tokenKey, response.token);
    const user: CurrentUser = { userId: response.userId, fullName: response.fullName, role: response.role };
    sessionStorage.setItem(this.userKey, JSON.stringify(user));
    this._currentUser.set(user);
  }

  clearSession(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this._currentUser.set(null);
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this._currentUser();
    return user !== null && roles.includes(user.role);
  }

  private readStoredUser(): CurrentUser | null {
    const raw = sessionStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  }
}