import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminHolidaysApiService } from '../../../core/api/admin-holidays-api.service';
import { HolidayResponse, AppError } from '../../../core/models/models';

@Component({
  selector: 'app-admin-holidays',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Public Holidays</h1>
          <p class="subtitle">Holidays are excluded from chargeable business day calculations.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()">+ Add Holiday</button>
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
          <p>Loading configured holidays…</p>
        </div>
      } @else if (sortedHolidays().length === 0) {
        <div class="card state-card">
          <p class="empty-title">No public holidays found</p>
          <p class="empty-desc">Click "+ Add Holiday" to configure public holidays.</p>
        </div>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Holiday Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (h of sortedHolidays(); track h.id) {
                <tr>
                  <td class="font-medium">{{ h.name }}</td>
                  <td>{{ h.date }}</td>
                  <td>
                    @if (isFuture(h.date)) {
                      <span class="badge badge-upcoming">Upcoming</span>
                    } @else {
                      <span class="badge badge-past">Past</span>
                    }
                  </td>
                  <td class="action-buttons">
                    <button type="button" class="btn-link" (click)="openEditModal(h)">Edit</button>
                    <!-- Strict rule: AC-36 only future holidays can be deleted -->
                    @if (isFuture(h.date)) {
                      <button
                        type="button"
                        class="btn-link danger"
                        [disabled]="deletingId() === h.id"
                        (click)="deleteHoliday(h.id)"
                      >
                        {{ deletingId() === h.id ? 'Deleting…' : 'Delete' }}
                      </button>
                    } @else {
                      <span class="text-muted" title="Past holidays cannot be deleted per policy rules">&mdash;</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Add/Edit Holiday Modal -->
      @if (isModalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>{{ editingHoliday() ? 'Edit Holiday' : 'Add Public Holiday' }}</h2>
            <p class="modal-desc">Dates must be unique. Duplicate holiday dates are blocked.</p>

            <form [formGroup]="form" (ngSubmit)="saveHoliday()">
              <label for="name">Holiday Name</label>
              <input id="name" type="text" formControlName="name" placeholder="e.g. National Day" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="field-error">Holiday name is required.</span>
              }

              <label for="date">Date</label>
              <input id="date" type="date" formControlName="date" />
              @if (form.controls.date.touched && form.controls.date.invalid) {
                <span class="field-error">Valid date is required.</span>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-neutral" [disabled]="isSubmitting()" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmitting() || form.invalid">
                  {{ isSubmitting() ? 'Saving…' : 'Save Holiday' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 800px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
    .page-header h1 { font-size: 1.5rem; margin-bottom: var(--space-1); }
    .subtitle { color: var(--color-ink-muted); font-size: 0.9375rem; margin: 0; }

    .table-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    .data-table th { background: var(--color-bg); padding: var(--space-3); font-weight: 600; color: var(--color-ink-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
    .data-table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border); vertical-align: middle; }

    .action-buttons { display: flex; gap: var(--space-3); align-items: center; }
    .btn-link { background: none; border: none; padding: 0; font-size: 0.8125rem; color: var(--color-accent); cursor: pointer; text-decoration: none; font-weight: 500; }
    .btn-link.danger { color: var(--color-danger); }
    .btn-link:disabled { opacity: 0.5; cursor: not-allowed; }

    .badge { padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .badge-upcoming { background: #e0f2fe; color: #0369a1; }
    .badge-past { background: #f1f5f9; color: #64748b; }

    .btn { padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-weight: 600; cursor: pointer; border: 1px solid transparent; font-size: 0.875rem; }
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
    .modal-card h2 { font-size: 1.125rem; margin: 0 0 2px; }
    .modal-desc { font-size: 0.8125rem; color: var(--color-ink-muted); margin-bottom: var(--space-3); }
    label { display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px; }
    input { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.9375rem; margin-bottom: var(--space-3); box-sizing: border-box; }
    .field-error { color: var(--color-danger); font-size: 0.8125rem; display: block; margin-top: -8px; margin-bottom: var(--space-2); }
    .modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }
  `]
})
export class AdminHolidaysComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly holidaysApi = inject(AdminHolidaysApiService);

  readonly holidays = signal<HolidayResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly isModalOpen = signal(false);
  readonly editingHoliday = signal<HolidayResponse | null>(null);
  readonly isSubmitting = signal(false);

  readonly sortedHolidays = computed(() => {
    return [...this.holidays()].sort((a, b) => a.date.localeCompare(b.date));
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    date: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.holidaysApi.getAll().subscribe({
      next: (data) => {
        this.holidays.set(data);
        this.isLoading.set(false);
      },
      error: (err: AppError) => {
        this.errorMessage.set(err.detail || 'Failed to load holidays.');
        this.isLoading.set(false);
      }
    });
  }

  isFuture(dateStr: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dateStr >= today;
  }

  openAddModal(): void {
    this.editingHoliday.set(null);
    this.form.reset({ name: '', date: '' });
    this.isModalOpen.set(true);
  }

  openEditModal(h: HolidayResponse): void {
    this.editingHoliday.set(h);
    this.form.patchValue({ name: h.name, date: h.date });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingHoliday.set(null);
  }

  saveHoliday(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.form.getRawValue();
    const existing = this.editingHoliday();

    const call$ = existing
      ? this.holidaysApi.update(existing.id, val)
      : this.holidaysApi.create(val);

    call$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModal();
        this.successMessage.set(`Holiday "${val.name}" saved.`);
        this.loadHolidays();
      },
      error: (err: AppError) => {
        this.isSubmitting.set(false);
        // Direct backend detail surfacing (e.g. holiday.duplicate_date)
        this.errorMessage.set(err.detail || 'Could not save holiday.');
      }
    });
  }

  deleteHoliday(id: string): void {
    if (!confirm('Are you sure you want to delete this public holiday?')) return;

    this.deletingId.set(id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.holidaysApi.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.successMessage.set('Holiday deleted.');
        this.loadHolidays();
      },
      error: (err: AppError) => {
        this.deletingId.set(null);
        this.errorMessage.set(err.detail || 'Cannot delete holiday.');
      }
    });
  }
}