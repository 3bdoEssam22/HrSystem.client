import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminSettingsApiService } from '../../../core/api/admin-settings-api.service';
import { ParticipationStatus, AppError } from '../../../core/models/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="settings-page">
      <div class="header">
        <h1>Participation Settings</h1>
        <p class="subtitle">Global rules governing employee leave program enrollment and cooldown periods.</p>
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
          <p>Loading company configuration…</p>
        </div>
      } @else {
        <div class="card form-card">
          <form [formGroup]="form" (ngSubmit)="saveSettings()">
            <label for="defaultStatus">Default Status for New Employees</label>
            <select id="defaultStatus" formControlName="defaultStatus">
              <option value="OptedIn">Opted In (Enrolled upon creation)</option>
              <option value="OptedOut">Opted Out</option>
            </select>
            <p class="field-desc">Determines whether newly created employee accounts automatically join the leave program.</p>

            <label for="cooldown">Re-Opt-In Cooldown Window (Days)</label>
            <input id="cooldown" type="number" formControlName="reOptInCooldownDays" min="0" />
            <p class="field-desc">Number of days an employee must wait before they can re-enroll after opting out. Set to 0 for immediate re-enrollment.</p>

            <div class="toggle-row">
              <input id="selfOptOut" type="checkbox" formControlName="allowEmployeeSelfOptOut" />
              <div>
                <label for="selfOptOut" class="toggle-label">Allow Employee Self Opt-Out</label>
                <p class="field-desc">If unchecked, employees cannot opt themselves out; only administrators can force opt-out.</p>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="isSaving() || form.invalid">
                {{ isSaving() ? 'Saving Configuration…' : 'Save Settings' }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page { max-width: 600px; }
    .header { margin-bottom: var(--space-4); }
    .header h1 { font-size: 1.5rem; margin-bottom: var(--space-1); }
    .subtitle { color: var(--color-ink-muted); font-size: 0.9375rem; margin: 0; }

    .form-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: var(--space-5); }
    label { display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px; }
    select, input[type="number"] { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.9375rem; margin-bottom: 2px; box-sizing: border-box; background: var(--color-surface); }
    .field-desc { font-size: 0.8125rem; color: var(--color-ink-muted); margin: 0 0 var(--space-4) 0; }

    .toggle-row { display: flex; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-4); }
    .toggle-row input[type="checkbox"] { margin-top: 3px; }
    .toggle-label { font-size: 0.875rem; margin-bottom: 2px; cursor: pointer; }

    .form-actions { display: flex; justify-content: flex-end; border-top: 1px solid var(--color-border); padding-top: var(--space-4); }
    .btn { padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-weight: 600; cursor: pointer; border: 1px solid transparent; font-size: 0.875rem; }
    .btn-primary { background: var(--color-accent); color: var(--color-accent-ink); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .state-card { padding: var(--space-6); text-align: center; color: var(--color-ink-muted); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--color-border); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto var(--space-2); }
    @keyframes spin { to { transform: rotate(360deg); } }

    .banner { padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-3); font-size: 0.875rem; }
    .banner-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .banner-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .banner p { margin: 0; }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsApi = inject(AdminSettingsApiService);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    defaultStatus: ['OptedIn' as ParticipationStatus, Validators.required],
    allowEmployeeSelfOptOut: [true, Validators.required],
    reOptInCooldownDays: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.settingsApi.get().subscribe({
      next: (data) => {
        this.form.patchValue({
          defaultStatus: data.defaultStatus,
          allowEmployeeSelfOptOut: data.allowEmployeeSelfOptOut,
          reOptInCooldownDays: data.reOptInCooldownDays
        });
        this.isLoading.set(false);
      },
      error: (err: AppError) => {
        this.errorMessage.set(err.detail || 'Failed to load participation settings.');
        this.isLoading.set(false);
      }
    });
  }

  saveSettings(): void {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.form.getRawValue();

    this.settingsApi.update({
      defaultStatus: val.defaultStatus,
      allowEmployeeSelfOptOut: val.allowEmployeeSelfOptOut,
      reOptInCooldownDays: Number(val.reOptInCooldownDays)
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Participation configuration saved.');
      },
      error: (err: AppError) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.detail || 'Could not save settings.');
      }
    });
  }
}