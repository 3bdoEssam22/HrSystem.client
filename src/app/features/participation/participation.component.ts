import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipationApiService } from '../../core/api/participation-api.service';
import { ParticipationStatusResponse, AppError } from '../../core/models/models';

@Component({
    selector: 'app-participation',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="participation-page">
      <div class="header">
        <h1>Program Participation</h1>
        <p class="subtitle">Manage your enrollment in the company leave program.</p>
      </div>

      <!-- Error / Conflict Banner -->
      @if (errorMessage()) {
        <div class="banner banner-error" role="alert">
          <span class="banner-icon">⚠</span>
          <p>{{ errorMessage() }}</p>
        </div>
      }

      <!-- Success Banner -->
      @if (successMessage()) {
        <div class="banner banner-success" role="alert">
          <span class="banner-icon">✓</span>
          <p>{{ successMessage() }}</p>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="card loading-card">
          <div class="spinner"></div>
          <p>Loading participation details...</p>
        </div>
      } @else if (participation()) {
        <!-- Status Card -->
        <div class="card">
          <div class="card-header">
            <span class="label">Current Status</span>
            @if (isOptedIn()) {
              <span class="badge badge-success"><span class="dot"></span> Opted In</span>
            } @else {
              <span class="badge badge-warning"><span class="dot"></span> Opted Out</span>
            }
          </div>

          <div class="card-body">
            @if (isOptedIn()) {
              <p class="desc">
                You are currently <strong>enrolled</strong> in the leave program. You can request Vacation, Day Off, and Sick Leave.
              </p>
            } @else {
              <p class="desc">
                You are currently <strong>opted out</strong>. Your existing leave balances and historical records remain intact, but you cannot submit new leave requests.
              </p>

              <div class="meta-list">
                @if (participation()?.lastOptOutAt) {
                  <div class="meta-item">
                    <span class="meta-key">Opted out on:</span>
                    <span class="meta-val">{{ participation()?.lastOptOutAt | date:'medium' }}</span>
                  </div>
                }
                @if (participation()?.eligibleToOptInOn) {
                  <div class="meta-item">
                    <span class="meta-key">Eligible to re-enroll on:</span>
                    <span class="meta-val highlight">{{ participation()?.eligibleToOptInOn }}</span>
                  </div>
                }
              </div>

              @if (isCooldownActive()) {
                <div class="cooldown-box">
                  <strong>Cooldown Active:</strong> Re-enrollment is locked until 
                  <strong>{{ participation()?.eligibleToOptInOn }}</strong> by company policy.
                </div>
              }
            }
          </div>

          <div class="card-footer">
            @if (isOptedIn()) {
              <button
                type="button"
                class="btn btn-secondary-danger"
                [disabled]="isSubmitting()"
                (click)="openConfirm('opt-out')"
              >
                Opt Out of Leave Program
              </button>
            } @else {
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="isSubmitting()"
                (click)="openConfirm('opt-in')"
              >
                Opt In to Leave Program
              </button>
            }
          </div>
        </div>

        <!-- Rules Info Box -->
        <div class="card info-card">
          <h3>Leave Participation Rules</h3>
          <ul>
            <li><strong>Balance Preservation:</strong> Opting out freezes your accrued leave balances; they are never wiped or reset.</li>
            <li><strong>Blocking Requests:</strong> You cannot opt out if you have any <em>Pending</em> requests or future <em>Approved</em> leaves.</li>
            <li><strong>Cooldown:</strong> After opting out, re-enrolling is subject to the administrative cooldown period.</li>
          </ul>
        </div>
      }

      <!-- Modal Dialog -->
      @if (showConfirmModal()) {
        <div class="modal-backdrop" (click)="closeConfirm()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>{{ pendingAction() === 'opt-in' ? 'Confirm Opt-In' : 'Confirm Opt-Out' }}</h2>
            @if (pendingAction() === 'opt-out') {
              <p>Are you sure you want to opt out? You will not be able to submit new leave requests while opted out.</p>
            } @else {
              <p>Are you ready to resume participation in the leave program? Your leave balances will be available immediately.</p>
            }
            <div class="modal-actions">
              <button type="button" class="btn btn-neutral" [disabled]="isSubmitting()" (click)="closeConfirm()">Cancel</button>
              <button
                type="button"
                [class]="pendingAction() === 'opt-out' ? 'btn btn-danger' : 'btn btn-primary'"
                [disabled]="isSubmitting()"
                (click)="executeConfirmed()"
              >
                {{ isSubmitting() ? 'Saving…' : 'Confirm' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .participation-page { max-width: 720px; }
    .header { margin-bottom: var(--space-4); }
    .header h1 { font-size: 1.5rem; margin-bottom: var(--space-1); }
    .subtitle { color: var(--color-ink-muted); font-size: 0.9375rem; margin: 0; }

    .banner { display: flex; gap: var(--space-2); padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-4); font-size: 0.875rem; }
    .banner-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .banner-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .banner-icon { font-weight: bold; }
    .banner p { margin: 0; }

    .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); margin-bottom: var(--space-4); }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
    .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-ink-muted); }

    .card-body { padding: var(--space-4); }
    .desc { font-size: 0.9375rem; line-height: 1.5; margin: 0 0 var(--space-3); }

    .meta-list { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius); padding: var(--space-3); margin-bottom: var(--space-3); }
    .meta-item { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: var(--space-1); }
    .meta-key { color: var(--color-ink-muted); }
    .meta-val.highlight { color: var(--color-accent); font-weight: 600; }

    .cooldown-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-size: 0.875rem; color: #92400e; }

    .card-footer { padding: var(--space-3) var(--space-4); background: var(--color-bg); border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; }

    .info-card { padding: var(--space-4); }
    .info-card h3 { font-size: 0.9375rem; margin: 0 0 var(--space-2); }
    .info-card ul { margin: 0; padding-left: 1.25rem; font-size: 0.875rem; color: var(--color-ink-muted); line-height: 1.6; }

    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .badge .dot { width: 6px; height: 6px; border-radius: 50%; }
    .badge-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-success .dot { background: #10b981; }
    .badge-warning { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
    .badge-warning .dot { background: #f97316; }

    .btn { padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: var(--color-accent); color: var(--color-accent-ink); }
    .btn-secondary-danger { background: var(--color-surface); color: var(--color-danger); border-color: var(--color-danger-bg); }
    .btn-danger { background: var(--color-danger); color: #fff; }
    .btn-neutral { background: var(--color-surface); border-color: var(--color-border); }

    .loading-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-6); color: var(--color-ink-muted); }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--color-border); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: var(--space-2); }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); max-width: 440px; width: 100%; padding: var(--space-4); }
    .modal-card h2 { font-size: 1.125rem; margin: 0 0 var(--space-2); }
    .modal-card p { font-size: 0.875rem; color: var(--color-ink-muted); margin: 0 0 var(--space-4); line-height: 1.5; }
    .modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
  `]
})
export class ParticipationComponent implements OnInit {
    private readonly participationApi = inject(ParticipationApiService);

    readonly isLoading = signal(true);
    readonly isSubmitting = signal(false);
    readonly participation = signal<ParticipationStatusResponse | null>(null);
    readonly errorMessage = signal<string | null>(null);
    readonly successMessage = signal<string | null>(null);
    readonly showConfirmModal = signal(false);
    readonly pendingAction = signal<'opt-in' | 'opt-out' | null>(null);

    readonly isOptedIn = computed(() => this.participation()?.status === 'OptedIn');
    readonly isOptedOut = computed(() => this.participation()?.status === 'OptedOut');

    readonly isCooldownActive = computed(() => {
        const dateStr = this.participation()?.eligibleToOptInOn;
        if (!dateStr || this.isOptedIn()) return false;
        const eligibleDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eligibleDate > today;
    });

    ngOnInit(): void {
        this.loadStatus();
    }

    loadStatus(): void {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        this.participationApi.getStatus().subscribe({
            next: (data) => {
                this.participation.set(data);
                this.isLoading.set(false);
            },
            error: (err: AppError) => {
                this.errorMessage.set(err.detail || 'Failed to load participation record.');
                this.isLoading.set(false);
            }
        });
    }

    openConfirm(action: 'opt-in' | 'opt-out'): void {
        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.pendingAction.set(action);
        this.showConfirmModal.set(true);
    }

    closeConfirm(): void {
        this.showConfirmModal.set(false);
        this.pendingAction.set(null);
    }

    executeConfirmed(): void {
        const action = this.pendingAction();
        if (!action || this.isSubmitting()) return;

        this.isSubmitting.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const call$ = action === 'opt-in'
            ? this.participationApi.optIn()
            : this.participationApi.optOut();

        call$.subscribe({
            next: () => {
                this.isSubmitting.set(false);
                this.closeConfirm();
                this.successMessage.set(
                    action === 'opt-in'
                        ? 'Successfully opted into the leave program.'
                        : 'Successfully opted out of the leave program.'
                );
                this.loadStatus();
            },
            error: (err: AppError) => {
                this.isSubmitting.set(false);
                this.closeConfirm();
                this.errorMessage.set(err.detail || 'Unable to update participation status.');
            }
        });
    }
}