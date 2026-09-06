import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminUserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ForceParticipationRequest
} from '../models/models';

interface GenericResponse<T> {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  errorType: string;
  validationErrors: Record<string, string[]> | null;
  data: T;
}

interface GenericCommandResponse {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  errorType: string;
  validationErrors: Record<string, string[]> | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/users`;

  getAll(): Observable<AdminUserResponse[]> {
    return this.http
      .get<GenericResponse<AdminUserResponse[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  create(body: CreateUserRequest): Observable<AdminUserResponse> {
    return this.http
      .post<GenericResponse<AdminUserResponse>>(this.baseUrl, body)
      .pipe(map((res) => res.data));
  }

  update(id: string, body: UpdateUserRequest): Observable<AdminUserResponse> {
    return this.http
      .put<GenericResponse<AdminUserResponse>>(`${this.baseUrl}/${id}`, body)
      .pipe(map((res) => res.data));
  }

  forceOptIn(id: string, body: ForceParticipationRequest): Observable<void> {
    return this.http
      .post<GenericCommandResponse>(`${this.baseUrl}/${id}/force-opt-in`, body)
      .pipe(map(() => void 0));
  }

  forceOptOut(id: string, body: ForceParticipationRequest): Observable<void> {
    return this.http
      .post<GenericCommandResponse>(`${this.baseUrl}/${id}/force-opt-out`, body)
      .pipe(map(() => void 0));
  }
}