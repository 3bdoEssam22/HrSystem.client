import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerApiService } from '../../core/api/manager-api.service';
import { LeaveRequestWithEmployeeResponse, AppError } from '../../core/models/models';

@Component({
  selector: 'app-team-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="queue-page">
      <div class="page-header">
        <h1>Team Leave Requests</h1>
        <p class="subtitle">Review and decide pending leave applications submitted by your direct reports.</p>
      </div>

      @if (errorMessage()) {
        <div class="banner banner-error">
          <p>{{ errorMessage() }}</p>
        </div>
      }

      @if (successMessage()) {
        <div class="banner banner-success">
          <p>{{ successMessage() }}</p>
        </div>
      }

      @if (isLoading()) {
        <div class="card state-card">
          <div class="spinner"></div>
          <p>Loading pending team requests…</p>
        </div>
      } @else if (requests().length === 0) {
        <div class="card state-card">
          <p class="empty-title">No pending requests</p>
          <p class="empty-desc">Your team queue is currently empty.</p>
        </div>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Date Range</th>
                <th>Days</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (req of requests(); track req.id) {
                <tr>
                  <td class="font-medium">{{ req.employeeFullName }}</td>
                  <td>{{ formatType(req.type) }}</td>
                  <td>{{ req.startDate }} &rarr; {{ req.endDate }}</td>
                  <td>{{ req.chargeableBusinessDays }} d</td>
                  <td class="text-muted">{{ req.submittedAt | date:'shortDate' }}</td>
                  <td class="action-buttons">
                    <button
                      type="button"
                      class="btn btn-sm btn-approve"
                      [disabled]="processingId() === req.id"
                      (click)="approve(req.id)"
                    >
                      {{ processingId() === req.id ? 'Saving…' : 'Approve' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-reject"
                      [disabled]="processingId() === req.id"
                      (click)="openRejectModal(req)"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Reject Modal with Optional Reason -->
      @if (rejectingRequest()) {
        <div class="modal-backdrop" (click)="closeRejectModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>Reject Leave Request</h2>
            <p class="modal-desc">
              Rejecting request for <strong>{{ rejectingRequest()!.employeeFullName }}</strong> 
              ({{ formatType(rejectingRequest()!.type) }}, {{ rejectingRequest()!.chargeableBusinessDays }} days).
            </p>

            <label for="rejectReason">Reason for Rejection (Optional)</label>
            <textarea
              id="rejectReason"
              rows="3"
              [(ngModel)]="rejectReason"
              placeholder="Provide context or explanation for the employee..."
            ></textarea>

            <div class="modal-actions">
              <button type="button" class="btn btn-neutral" [disabled]="isSubmittingModal()" (click)="closeRejectModal()">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                [disabled]="isSubmittingModal()"
                (click)="confirmReject()"
              >
                {{ isSubmittingModal() ? 'Rejecting…' : 'Confirm Rejection' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .queue-page { max-width: 900px; }
    .page-header { margin-bottom: var(--space-4); }
    .page-header h1 { font-size: 1.5rem; margin-bottom: var(--space-1); }
    .subtitle { color: var(--color-ink-muted); font-size: 0.9375rem; margin: 0; }

    .table-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    .data-table th { background: var(--color-bg); padding: var(--space-3); font-weight: 600; color: var(--color-ink-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
    .data-table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }

    .action-buttons { display: flex; gap: var(--space-2); }
    .btn { padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn-sm { padding: 4px 10px; font-size: 0.8125rem; }
    .btn-approve { background: #0f766e; color: #fff; }
    .btn-reject { background: var(--color-surface); border-color: #fecaca; color: #dc2626; }
    .btn-neutral { background: var(--color-surface); border-color: var(--color-border); color: var(--color-ink); }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .state-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: var(--space-6); text-align: center; color: var(--color-ink-muted); }
    .empty-title { font-size: 1.125rem; font-weight: 600; color: var(--color-ink); margin-bottom: 4px; }
    .empty-desc { font-size: 0.875rem; margin: 0; }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--color-border); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto var(--space-2); }
    @keyframes spin { to { transform: rotate(360deg); } }

    .banner { padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-3); font-size: 0.875rem; }
    .banner-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .banner-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .banner p { margin: 0; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); max-width: 440px; width: 100%; padding: var(--space-4); }
    .modal-card h2 { font-size: 1.125rem; margin: 0 0 var(--space-2); }
    .modal-desc { font-size: 0.875rem; color: var(--color-ink-muted); margin-bottom: var(--space-3); line-height: 1.4; }
    label { display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: var(--space-1); }
    textarea { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.875rem; margin-bottom: var(--space-3); resize: vertical; box-sizing: border-box; }
    .modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
  `]
})
export class TeamRequestsComponent implements OnInit {
  private readonly managerApi = inject(ManagerApiService);

  readonly requests = signal<LeaveRequestWithEmployeeResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly processingId = signal<string | null>(null);

  readonly rejectingRequest = signal<LeaveRequestWithEmployeeResponse | null>(null);
  readonly isSubmittingModal = signal(false);
  rejectReason = '';

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.managerApi.getPending().subscribe({
      next: (data) => {
        this.requests.set(data);
        this.isLoading.set(false);
      },
      error: (err: AppError) => {
        this.errorMessage.set(err.detail || 'Failed to load team requests.');
        this.isLoading.set(false);
      }
    });
  }

  formatType(type: string): string {
    if (type === 'DayOff') return 'Day Off';
    if (type === 'SickLeave') return 'Sick Leave';
    return 'Vacation';
  }

  approve(id: string): void {
    this.processingId.set(id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.managerApi.approve(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.successMessage.set('Leave request approved successfully.');
        this.loadPending();
      },
      error: (err: AppError) => {
        this.processingId.set(null);
        this.errorMessage.set(err.detail || 'Failed to approve request.');
      }
    });
  }

  openRejectModal(req: LeaveRequestWithEmployeeResponse): void {
    this.rejectingRequest.set(req);
    this.rejectReason = '';
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  closeRejectModal(): void {
    this.rejectingRequest.set(null);
    this.rejectReason = '';
  }

  confirmReject(): void {
    const req = this.rejectingRequest();
    if (!req) return;

    this.isSubmittingModal.set(true);

    this.managerApi.reject(req.id, { reason: this.rejectReason.trim() || null }).subscribe({
      next: () => {
        this.isSubmittingModal.set(false);
        this.closeRejectModal();
        this.successMessage.set('Leave request rejected.');
        this.loadPending();
      },
      error: (err: AppError) => {
        this.isSubmittingModal.set(false);
        this.closeRejectModal();
        this.errorMessage.set(err.detail || 'Failed to reject request.');
      }
    });
  }
}