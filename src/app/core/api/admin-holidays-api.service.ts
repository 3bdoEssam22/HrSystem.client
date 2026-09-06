import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HolidayResponse, CreateHolidayRequest, UpdateHolidayRequest } from '../models/models';

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
export class AdminHolidaysApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/holidays`;

  getAll(): Observable<HolidayResponse[]> {
    return this.http
      .get<GenericResponse<HolidayResponse[]>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  create(body: CreateHolidayRequest): Observable<HolidayResponse> {
    return this.http
      .post<GenericResponse<HolidayResponse>>(this.baseUrl, body)
      .pipe(map((res) => res.data));
  }

  update(id: string, body: UpdateHolidayRequest): Observable<HolidayResponse> {
    return this.http
      .put<GenericResponse<HolidayResponse>>(`${this.baseUrl}/${id}`, body)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<GenericCommandResponse>(`${this.baseUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}