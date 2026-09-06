import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GenericResponse } from '../models/models';
import {
  LeaveRequestResponse,
  LeaveBalanceResponse,
  CreateLeaveRequestRequest,
  UpdateLeaveRequestRequest,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class LeaveRequestsApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/leave-requests`;

  getMine(): Observable<LeaveRequestResponse[]> {
    return this.http
      .get<GenericResponse<LeaveRequestResponse[]>>(`${this.baseUrl}/mine`)
      .pipe(map((res) => res.data ?? []));
  }

  getById(id: string): Observable<LeaveRequestResponse> {
    return this.http
      .get<GenericResponse<LeaveRequestResponse>>(`${this.baseUrl}/mine/${id}`)
      .pipe(map((res) => res.data!));
  }

  create(body: CreateLeaveRequestRequest): Observable<LeaveRequestResponse> {
    return this.http
      .post<GenericResponse<LeaveRequestResponse>>(this.baseUrl, body)
      .pipe(map((res) => res.data!));
  }

  update(id: string, body: UpdateLeaveRequestRequest): Observable<LeaveRequestResponse> {
    return this.http
      .put<GenericResponse<LeaveRequestResponse>>(`${this.baseUrl}/${id}`, body)
      .pipe(map((res) => res.data!));
  }

  cancel(id: string): Observable<void> {
    return this.http
      .post<GenericResponse<void>>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(map(() => void 0));
  }

  getBalances(): Observable<LeaveBalanceResponse[]> {
    return this.http
      .get<GenericResponse<LeaveBalanceResponse[]>>(`${this.baseUrl}/balances`)
      .pipe(map((res) => res.data ?? []));
  }
}