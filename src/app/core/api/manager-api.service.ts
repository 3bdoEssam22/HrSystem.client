import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeaveRequestWithEmployeeResponse, RejectRequestBody } from '../models/models';

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
export class ManagerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/manager/leave-requests`;

  getPending(): Observable<LeaveRequestWithEmployeeResponse[]> {
    return this.http
      .get<GenericResponse<LeaveRequestWithEmployeeResponse[]>>(`${this.baseUrl}/pending`)
      .pipe(map((res) => res.data));
  }

  approve(id: string): Observable<void> {
    return this.http
      .post<GenericCommandResponse>(`${this.baseUrl}/${id}/approve`, {})
      .pipe(map(() => void 0));
  }

  reject(id: string, body: RejectRequestBody): Observable<void> {
    return this.http
      .post<GenericCommandResponse>(`${this.baseUrl}/${id}/reject`, body)
      .pipe(map(() => void 0));
  }
}