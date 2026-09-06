import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/models';
import { AuthService } from '../services/auth.service';

// A factory, not a guard itself — lets routes write canActivate: [roleGuard(['Admin'])].
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    if (inject(AuthService).hasRole(...allowedRoles)) return true;

    inject(Router).navigate(['/dashboard']); // wrong role, not logged out — bounce to a safe page, not login
    return false;
  };
}