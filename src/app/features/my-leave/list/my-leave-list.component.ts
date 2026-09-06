import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaveRequestsApiService } from '../../../core/api/leave-requests-api.service';
import { LeaveRequestResponse, LeaveType, LeaveRequestStatus } from '../../../core/models/models';
import { AppError } from '../../../core/models/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type LoadState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-my-leave-list',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ErrorBannerComponent, EmptyStateComponent],
  templateUrl: './my-leave-list.component.html',
  styleUrl: './my-leave-list.component.css',
})
export class MyLeaveListComponent implements OnInit {
  private api = inject(LeaveRequestsApiService);

  state = signal<LoadState>('loading');
  error = signal<AppError | null>(null);
  requests = signal<LeaveRequestResponse[]>([]);

  typeFilter = signal<LeaveType | 'All'>('All');
  statusFilter = signal<LeaveRequestStatus | 'All'>('All');

  readonly typeOptions: (LeaveType | 'All')[] = ['All', 'Vacation', 'DayOff', 'SickLeave'];
  readonly statusOptions: (LeaveRequestStatus | 'All')[] = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

  filteredRequests = computed(() => {
    const type = this.typeFilter();
    const status = this.statusFilter();
    return this.requests()
      .filter((r) => type === 'All' || r.type === type)
      .filter((r) => status === 'All' || r.status === status)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.error.set(null);
    this.api.getMine().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.state.set('success');
      },
      error: (err: AppError) => {
        this.error.set(err);
        this.state.set('error');
      },
    });
  }
}