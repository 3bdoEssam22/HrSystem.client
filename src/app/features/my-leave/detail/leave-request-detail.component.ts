import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LeaveRequestsApiService } from '../../../core/api/leave-requests-api.service';
import { LeaveRequestResponse } from '../../../core/models/models';
import { AppError } from '../../../core/models/models';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type LoadState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-leave-request-detail',
  standalone: true,
  imports: [RouterLink, ErrorBannerComponent, LoadingSpinnerComponent],
  templateUrl: './leave-request-detail.component.html',
  styleUrl: './leave-request-detail.component.css',
})
export class LeaveRequestDetailComponent implements OnInit {
  private api = inject(LeaveRequestsApiService);
  private route = inject(ActivatedRoute);

  state = signal<LoadState>('loading');
  error = signal<AppError | null>(null);
  request = signal<LeaveRequestResponse | null>(null);
  cancelling = signal(false);
  cancelError = signal<AppError | null>(null);

  canEdit = computed(() => this.request()?.status === 'Pending');
  canCancel = computed(() => {
    const r = this.request();
    if (!r) return false;
    if (r.status === 'Pending') return true;
    if (r.status === 'Approved') return new Date(r.startDate) > new Date();
    return false;
  });

  ngOnInit(): void {
    this.load(this.route.snapshot.paramMap.get('id')!);
  }

  load(id: string): void {
    this.state.set('loading');
    this.api.getById(id).subscribe({
      next: (r) => {
        this.request.set(r);
        this.state.set('success');
      },
      error: (err: AppError) => {
        this.error.set(err);
        this.state.set('error');
      },
    });
  }

  cancel(): void {
    const r = this.request();
    if (!r) return;
    this.cancelling.set(true);
    this.cancelError.set(null);
    this.api.cancel(r.id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.load(r.id);
      },
      error: (err: AppError) => {
        this.cancelling.set(false);
        this.cancelError.set(err);
      },
    });
  }
}