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
  // Resolves to: https://localhost:7030/api/auth
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Exact destination: https://localhost:7030/api/auth/login
    return this.http
      .post<GenericResponse<LoginResponse>>(`${this.baseUrl}/login`, credentials)
      .pipe(map((res) => res.data));
  }

  getMe(): Observable<UserProfileResponse> {
    // Exact destination: https://localhost:7030/api/auth/me
    return this.http
      .get<GenericResponse<UserProfileResponse>>(`${this.baseUrl}/me`)
      .pipe(map((res) => res.data));
  }
}