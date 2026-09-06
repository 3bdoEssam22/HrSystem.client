import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GenericResponse } from '../models/models';
import { ParticipationStatusResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ParticipationApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/participation`;

  getStatus(): Observable<ParticipationStatusResponse> {
    return this.http
      .get<GenericResponse<ParticipationStatusResponse>>(`${this.baseUrl}/me`)
      .pipe(map((res) => res.data!));
  }

  optIn(): Observable<void> {
    return this.http
      .post<GenericResponse<void>>(`${this.baseUrl}/opt-in`, {})
      .pipe(map(() => void 0));
  }

  optOut(): Observable<void> {
    return this.http
      .post<GenericResponse<void>>(`${this.baseUrl}/opt-out`, {})
      .pipe(map(() => void 0));
  }
}