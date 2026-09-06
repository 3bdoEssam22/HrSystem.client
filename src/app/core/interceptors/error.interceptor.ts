import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AppError, ProblemDetails } from '../models/models';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((response: HttpErrorResponse) => {
      if (response.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
      }

      const body = response.error as ProblemDetails | undefined;
      // The generic fallback text below is the one deliberate exception to "never show a generic
      // message" — it only fires when the server gave literally no Problem Details body at all
      // (a network failure, a CORS error, or a truly raw 500), not for any normal error path.
      const appError: AppError = {
        status: response.status,
        detail: body?.detail ?? body?.title ?? 'Something went wrong. Please try again.',
        errorCode: body?.errorCode ?? null,
        validationErrors: body?.errors ?? null,
      };
      return throwError(() => appError);
    }),
  );
};