import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, UserProfileResponse } from '../models/models';

interface GenericResponse<T> {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  errorType: string;
  validationErrors: Record<string, string[]> | null;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  // Exact endpoint: https://localhost:7030/api/auth/login
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<GenericResponse<LoginResponse>>(
        `${environment.apiBaseUrl}/auth/login`,
        credentials
      )
      .pipe(map((res) => res.data));
  }

  // Exact endpoint: https://localhost:7030/api/auth/me
  getMe(): Observable<UserProfileResponse> {
    return this.http
      .get<GenericResponse<UserProfileResponse>>(
        `${environment.apiBaseUrl}/auth/me`
      )
      .pipe(map((res) => res.data));
  }
}