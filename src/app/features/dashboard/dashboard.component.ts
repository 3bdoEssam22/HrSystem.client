import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LeaveRequestsApiService } from '../../core/api/leave-requests-api.service';
import { ParticipationApiService } from '../../core/api/participation-api.service';
import { AuthService } from '../../core/services/auth.service';
import { LeaveBalanceResponse, LeaveRequestResponse, ParticipationStatusResponse } from '../../core/models/models';
import { AppError } from '../../core/models/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type LoadState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ErrorBannerComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private leaveApi = inject(LeaveRequestsApiService);
  private participationApi = inject(ParticipationApiService);
  auth = inject(AuthService);

  state = signal<LoadState>('loading');
  error = signal<AppError | null>(null);

  balances = signal<LeaveBalanceResponse[]>([]);
  participation = signal<ParticipationStatusResponse | null>(null);
  recentRequests = signal<LeaveRequestResponse[]>([]);

  isAdmin = computed(() => this.auth.currentUser()?.role === 'Admin');

  recentRequestsSorted = computed(() =>
    [...this.recentRequests()]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5)
  );

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.state.set('success');
      return;
    }
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.error.set(null);

    forkJoin({
      balances: this.leaveApi.getBalances(),
      participation: this.participationApi.getStatus(),
      requests: this.leaveApi.getMine(),
    }).subscribe({
      next: ({ balances, participation, requests }) => {
        this.balances.set(balances);
        this.participation.set(participation);
        this.recentRequests.set(requests);
        this.state.set('success');
      },
      error: (err: AppError) => {
        this.error.set(err);
        this.state.set('error');
      },
    });
  }
}