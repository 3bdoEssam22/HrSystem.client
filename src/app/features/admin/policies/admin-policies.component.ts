import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminPoliciesApiService } from '../../../core/api/admin-policies-api.service';
import { LeavePolicyResponse, LeaveType, AppError } from '../../../core/models/models';

@Component({
  selector: 'app-admin-policies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <div class="header">
        <h1>Leave Policies Configuration</h1>
        <p class="subtitle">Configure allowances and rules. Modifying values creates a new policy version server-side.</p>
      </div>

      @if (errorMessage()) {
        <div class="banner banner-error"><p>{{ errorMessage() }}</p></div>
      }
      @if (successMessage()) {
        <div class="banner banner-success"><p>{{ successMessage() }}</p></div>
      }

      @if (isLoading()) {
        <div class="card state-card">
          <div class="spinner"></div>
          <p>Loading policies…</p>
        </div>
      } @else {
        <div class="policy-grid">
          @for (policy of policies(); track policy.id) {
            <div class="card policy-card" [class.disabled-card]="!policy.enabled">
              <div class="card-header">
                <div>
                  <h2 class="policy-title">{{ formatType(policy.type) }}</h2>
                  <span class="version-tag">Version {{ policy.version }}</span>
                </div>
                <span class="badge" [class.badge-active]="policy.enabled" [class.badge-inactive]="!policy.enabled">
                  {{ policy.enabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>

              <div class="card-body">
                <div class="metric-row">
                  <span class="metric-label">Annual Allowance</span>
                  <span class="metric-val">{{ policy.annualAllowanceDays }} days</span>
                </div>

                @if (policy.type === 'Vacation') {
                  <div class="metric-row">
                    <span class="metric-label">Min Notice Required</span>
                    <span class="metric-val">{{ policy.minNoticeDays ?? 0 }} days</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Max Consecutive Days</span>
                    <span class="metric-val">{{ policy.maxConsecutiveBusinessDays ?? 'None' }}</span>
                  </div>
                }

                @if (policy.type === 'SickLeave') {
                  <div class="metric-row">
                    <span class="metric-label">Allowed Backdate Window</span>
                    <span class="metric-val">{{ policy.backdateDays ?? 0 }} days</span>
                  </div>
                }

                @if (policy.type === 'DayOff') {
                  <p class="metric-hint">Fixed constraint: Single business day requests only.</p>
                }
              </div>

              <div class="card-footer">
                <button
                  type="button"
                  class="btn btn-neutral btn-sm"
                  [disabled]="isToggling() === policy.type"
                  (click)="toggleEnabled(policy)"
                >
                  {{ policy.enabled ? 'Disable' : 'Enable' }}
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  (click)="openEditModal(policy)"
                >
                  Edit Configuration
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Edit Policy Modal -->
      @if (editingPolicy()) {
        <div class="modal-backdrop" (click)="closeEditModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>Update {{ formatType(editingPolicy()!.type) }} Policy</h2>
            <p class="modal-desc">
              Updating values will archive version {{ editingPolicy()!.version }} and publish version {{ editingPolicy()!.version + 1 }}.
            </p>

            <form [formGroup]="editForm" (ngSubmit)="savePolicy()">
              <label for="allowance">Annual Allowance (Days)</label>
              <input id="allowance" type="number" formControlName="annualAllowanceDays" min="0" />

              @if (editingPolicy()!.type === 'Vacation') {
                <label for="minNotice">Minimum Notice Days</label>
                <input id="minNotice" type="number" formControlName="minNoticeDays" min="0" />

                <label for="maxConsecutive">Maximum Consecutive Days</label>
                <input id="maxConsecutive" type="number" formControlName="maxConsecutiveBusinessDays" min="1" />
              }

              @if (editingPolicy()!.type === 'SickLeave') {
                <label for="backdate">Allowed Backdate Days</label>
                <input id="backdate" type="number" formControlName="backdateDays" min="0" />
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-neutral" [disabled]="isSaving()" (click)="closeEditModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSaving() || editForm.invalid">
                  {{ isSaving() ? 'Saving New Version…' : 'Save Version' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 960px; }
    .header { margin-bottom: var(--space-4); }
    .header h1 { font-size: 1.5rem; margin-bottom: var(--space-1); }
    .subtitle { color: var(--color-ink-muted); font-size: 0.9375rem; margin: 0; }

    .policy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4); }
    .policy-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); display: flex; flex-direction: column; }
    .policy-card.disabled-card { opacity: 0.75; }

    .card-header { display: flex; justify-content: space-between; align-items: flex-start; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
    .policy-title { font-size: 1.125rem; margin: 0 0 2px; }
    .version-tag { font-size: 0.75rem; color: var(--color-ink-muted); }

    .card-body { padding: var(--space-4); flex: 1; }
    .metric-row { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: var(--space-2); border-bottom: 1px dashed var(--color-border); padding-bottom: 4px; }
    .metric-label { color: var(--color-ink-muted); }
    .metric-val { font-weight: 600; }
    .metric-hint { font-size: 0.8125rem; color: var(--color-ink-muted); font-style: italic; margin-top: var(--space-3); }

    .card-footer { padding: var(--space-3) var(--space-4); background: var(--color-bg); border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; }

    .badge { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }

    .btn { padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-weight: 600; cursor: pointer; border: 1px solid transparent; font-size: 0.875rem; }
    .btn-sm { padding: 4px 10px; font-size: 0.8125rem; }
    .btn-primary { background: var(--color-accent); color: var(--color-accent-ink); }
    .btn-neutral { background: var(--color-surface); border-color: var(--color-border); color: var(--color-ink); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .state-card { padding: var(--space-6); text-align: center; color: var(--color-ink-muted); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--color-border); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto var(--space-2); }
    @keyframes spin { to { transform: rotate(360deg); } }

    .banner { padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-3); font-size: 0.875rem; }
    .banner-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .banner-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .banner p { margin: 0; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); max-width: 440px; width: 100%; padding: var(--space-4); }
    .modal-card h2 { font-size: 1.125rem; margin: 0 0 var(--space-1); }
    .modal-desc { font-size: 0.8125rem; color: var(--color-ink-muted); margin-bottom: var(--space-3); }
    label { display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px; }
    input { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.9375rem; margin-bottom: var(--space-3); box-sizing: border-box; }
    .modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }
  `]
})
export class AdminPoliciesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly policiesApi = inject(AdminPoliciesApiService);

  readonly policies = signal<LeavePolicyResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isToggling = signal<string | null>(null);

  readonly editingPolicy = signal<LeavePolicyResponse | null>(null);
  readonly isSaving = signal(false);

  protected readonly editForm = this.fb.nonNullable.group({
    annualAllowanceDays: [0, [Validators.required, Validators.min(0)]],
    minNoticeDays: [null as number | null],
    maxConsecutiveBusinessDays: [null as number | null],
    backdateDays: [null as number | null]
  });

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.policiesApi.getAll().subscribe({
      next: (data) => {
        this.policies.set(data);
        this.isLoading.set(false);
      },
      error: (err: AppError) => {
        this.errorMessage.set(err.detail || 'Failed to load leave policies.');
        this.isLoading.set(false);
      }
    });
  }

  formatType(type: string): string {
    if (type === 'DayOff') return 'Day Off';
    if (type === 'SickLeave') return 'Sick Leave';
    return 'Vacation';
  }

  toggleEnabled(policy: LeavePolicyResponse): void {
    this.isToggling.set(policy.type);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const call$ = policy.enabled
      ? this.policiesApi.disable(policy.type)
      : this.policiesApi.enable(policy.type);

    call$.subscribe({
      next: () => {
        this.isToggling.set(null);
        this.successMessage.set(`Policy ${policy.type} ${policy.enabled ? 'disabled' : 'enabled'} successfully.`);
        this.loadPolicies();
      },
      error: (err: AppError) => {
        this.isToggling.set(null);
        this.errorMessage.set(err.detail || 'Failed to toggle policy status.');
      }
    });
  }

  openEditModal(policy: LeavePolicyResponse): void {
    this.editingPolicy.set(policy);
    this.editForm.patchValue({
      annualAllowanceDays: policy.annualAllowanceDays,
      minNoticeDays: policy.minNoticeDays,
      maxConsecutiveBusinessDays: policy.maxConsecutiveBusinessDays,
      backdateDays: policy.backdateDays
    });
  }

  closeEditModal(): void {
    this.editingPolicy.set(null);
  }

  savePolicy(): void {
    const policy = this.editingPolicy();
    if (!policy || this.editForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.editForm.getRawValue();

    this.policiesApi.update(policy.type, {
      annualAllowanceDays: Number(val.annualAllowanceDays),
      minNoticeDays: val.minNoticeDays != null ? Number(val.minNoticeDays) : null,
      maxConsecutiveBusinessDays: val.maxConsecutiveBusinessDays != null ? Number(val.maxConsecutiveBusinessDays) : null,
      backdateDays: val.backdateDays != null ? Number(val.backdateDays) : null
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.closeEditModal();
        this.successMessage.set(`Published version ${res.version} for ${this.formatType(policy.type)}.`);
        this.loadPolicies();
      },
      error: (err: AppError) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.detail || 'Failed to update policy.');
      }
    });
  }
}