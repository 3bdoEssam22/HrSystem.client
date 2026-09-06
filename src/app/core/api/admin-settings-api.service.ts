import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParticipationSettingsResponse, UpdateParticipationSettingsRequest } from '../models/models';

interface GenericResponse<T> {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  errorType: string;
  validationErrors: Record<string, string[]> | null;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/participation-settings`;

  get(): Observable<ParticipationSettingsResponse> {
    return this.http
      .get<GenericResponse<ParticipationSettingsResponse>>(this.baseUrl)
      .pipe(map((res) => res.data));
  }

  update(body: UpdateParticipationSettingsRequest): Observable<ParticipationSettingsResponse> {
    return this.http
      .put<GenericResponse<ParticipationSettingsResponse>>(this.baseUrl, body)
      .pipe(map((res) => res.data));
  }
}