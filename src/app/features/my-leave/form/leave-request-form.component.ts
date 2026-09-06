import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LeaveRequestsApiService } from '../../../core/api/leave-requests-api.service';
import { LeaveType } from '../../../core/models/models';
import { AppError } from '../../../core/models/models';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  if (start && end && end < start) {
    return { endBeforeStart: true };
  }
  return null;
}

type FormMode = 'create' | 'edit';
type LoadState = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-leave-request-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorBannerComponent, LoadingSpinnerComponent],
  templateUrl: './leave-request-form.component.html',
  styleUrl: './leave-request-form.component.css',
})
export class LeaveRequestFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(LeaveRequestsApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly leaveTypes: LeaveType[] = ['Vacation', 'DayOff', 'SickLeave'];

  mode = signal<FormMode>('create');
  requestId = signal<string | null>(null);
  loadState = signal<LoadState>('idle');
  submitting = signal(false);
  submitError = signal<AppError | null>(null);

  form = this.fb.nonNullable.group(
    {
      type: this.fb.nonNullable.control<LeaveType>('Vacation', Validators.required),
      startDate: this.fb.nonNullable.control('', Validators.required),
      endDate: this.fb.nonNullable.control('', Validators.required),
    },
    { validators: dateRangeValidator }
  );

  isDayOff = computed(() => this.form.controls.type.value === 'DayOff');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.mode.set('edit');
      this.requestId.set(id);
      this.loadState.set('loading');
      this.api.getById(id).subscribe({
        next: (r) => {
          if (r.status !== 'Pending') {
            this.router.navigate(['/my-leave', id]);
            return;
          }
          this.form.patchValue({ type: r.type, startDate: r.startDate, endDate: r.endDate });
          this.form.controls.type.disable();
          this.loadState.set('ready');
        },
        error: (err: AppError) => {
          this.submitError.set(err);
          this.loadState.set('error');
        },
      });
    } else {
      this.loadState.set('ready');
    }

    this.form.controls.type.valueChanges.subscribe((type) => {
      if (type === 'DayOff') {
        this.form.controls.endDate.setValue(this.form.controls.startDate.value);
      }
    });

    this.form.controls.startDate.valueChanges.subscribe((start) => {
      if (this.isDayOff()) {
        this.form.controls.endDate.setValue(start);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    const { type, startDate, endDate } = this.form.getRawValue();

    const id = this.requestId();
    const request$ =
      this.mode() === 'edit' && id
        ? this.api.update(id, { startDate, endDate })
        : this.api.create({ type, startDate, endDate });

    request$.subscribe({
      next: (r) => {
        this.submitting.set(false);
        this.router.navigate(['/my-leave', r.id]);
      },
      error: (err: AppError) => {
        this.submitting.set(false);
        this.submitError.set(err);
      },
    });
  }
}