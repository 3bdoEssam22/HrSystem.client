import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeavePolicyResponse, UpdateLeavePolicyRequest, LeaveType } from '../models/models';

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
export class AdminPoliciesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/policies`;

  getAll(): Observable<LeavePolicyResponse[]> {
    return this.http
      .get<GenericResponse<LeavePolicyResponse[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  getByType(type: LeaveType): Observable<LeavePolicyResponse> {
    return this.http
      .get<GenericResponse<LeavePolicyResponse>>(`${this.baseUrl}/${type}`)
      .pipe(map((res) => res.data));
  }

  update(type: LeaveType, body: UpdateLeavePolicyRequest): Observable<LeavePolicyResponse> {
    return this.http
      .put<GenericResponse<LeavePolicyResponse>>(`${this.baseUrl}/${type}`, body)
      .pipe(map((res) => res.data));
  }

  enable(type: LeaveType): Observable<void> {
    return this.http
      .post<GenericCommandResponse>(`${this.baseUrl}/${type}/enable`, {})
      .pipe(map(() => void 0));
  }

  disable(type: LeaveType): Observable<void> {
    return this.http
      .post<GenericCommandResponse>(`${this.baseUrl}/${type}/disable`, {})
      .pipe(map(() => void 0));
  }
}