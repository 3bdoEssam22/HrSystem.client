import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GenericResponse, LoginRequest, LoginResponse, UserProfileResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  login(request: LoginRequest): Observable<GenericResponse<LoginResponse>> {
    return this.http.post<GenericResponse<LoginResponse>>(`${this.baseUrl}/login`, request);
  }

  getCurrentUser(): Observable<GenericResponse<UserProfileResponse>> {
    return this.http.get<GenericResponse<UserProfileResponse>>(`${this.baseUrl}/me`);
  }
}