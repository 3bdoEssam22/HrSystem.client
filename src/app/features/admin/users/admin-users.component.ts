import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUsersApiService } from '../../../core/api/admin-users-api.service';
import { AdminUserResponse, UserRole, ParticipationStatus, AppError } from '../../../core/models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p class="subtitle">Manage user accounts, roles, direct manager relationships, and program participation.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">+ Create User</button>
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
          <p>Loading user directory…</p>
        </div>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Account</th>
                <th>Participation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td>
                    <div class="font-medium">{{ u.fullName }}</div>
                    <div class="text-muted sub-email">{{ u.email }}</div>
                  </td>
                  <td><span class="role-tag">{{ u.role }}</span></td>
                  <td>{{ getManagerName(u.managerId) }}</td>
                  <td>
                    <span class="badge" [class.badge-active]="u.isActive" [class.badge-inactive]="!u.isActive">
                      {{ u.isActive ? 'Active' : 'Deactivated' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-opted-in]="u.participationStatus === 'OptedIn'" [class.badge-opted-out]="u.participationStatus === 'OptedOut'">
                      {{ u.participationStatus === 'OptedIn' ? 'Opted In' : 'Opted Out' }}
                    </span>
                  </td>
                  <td class="action-cell">
                    <button type="button" class="btn-link" (click)="openEditModal(u)">Edit</button>
                    @if (u.role !== 'Admin') {
                      @if (u.participationStatus === 'OptedIn') {
                        <button type="button" class="btn-link warn" (click)="openForceModal(u, 'opt-out')">Force Opt-Out</button>
                      } @else {
                        <button type="button" class="btn-link safe" (click)="openForceModal(u, 'opt-in')">Force Opt-In</button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Create User Modal -->
      @if (isCreateModalOpen()) {
        <div class="modal-backdrop" (click)="isCreateModalOpen.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>Create New User</h2>
            <form [formGroup]="createForm" (ngSubmit)="saveCreateUser()">
              <label for="cEmail">Email</label>
              <input id="cEmail" type="email" formControlName="email" placeholder="user@company.local" />

              <label for="cName">Full Name</label>
              <input id="cName" type="text" formControlName="fullName" placeholder="Jane Doe" />

              <label for="cPass">Password</label>
              <input id="cPass" type="password" formControlName="password" />

              <div class="grid-2">
                <div>
                  <label for="cRole">Role</label>
                  <select id="cRole" formControlName="role">
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label for="cManager">Manager Assignment</label>
                  <select id="cManager" formControlName="managerId">
                    <option [ngValue]="null">&mdash; None &mdash;</option>
                    @for (m of managerList(); track m.id) {
                      <option [ngValue]="m.id">{{ m.fullName }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-neutral" [disabled]="isSubmittingModal()" (click)="isCreateModalOpen.set(false)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmittingModal() || createForm.invalid">
                  {{ isSubmittingModal() ? 'Creating…' : 'Create User' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit User Modal -->
      @if (editingUser()) {
        <div class="modal-backdrop" (click)="editingUser.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>Edit User: {{ editingUser()!.email }}</h2>
            <form [formGroup]="editForm" (ngSubmit)="saveEditUser()">
              <label for="eName">Full Name</label>
              <input id="eName" type="text" formControlName="fullName" />

              <div class="grid-2">
                <div>
                  <label for="eRole">Role</label>
                  <select id="eRole" formControlName="role">
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label for="eManager">Manager</label>
                  <select id="eManager" formControlName="managerId">
                    <option [ngValue]="null">&mdash; None &mdash;</option>
                    @for (m of availableManagersForEdit(); track m.id) {
                      <option [ngValue]="m.id">{{ m.fullName }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="checkbox-row">
                <input id="eActive" type="checkbox" formControlName="isActive" />
                <label for="eActive" class="checkbox-label">Account is Active (deactivated users cannot log in)</label>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-neutral" [disabled]="isSubmittingModal()" (click)="editingUser.set(null)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmittingModal() || editForm.invalid">
                  {{ isSubmittingModal() ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Force Participation Modal -->
      @if (forceTargetUser()) {
        <div class="modal-backdrop" (click)="forceTargetUser.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>Force {{ forceAction() === 'opt-in' ? 'Opt-In' : 'Opt-Out' }}</h2>
            <p class="modal-desc">
              Override program status for <strong>{{ forceTargetUser()!.fullName }}</strong>. 
              An administrative reason is strictly required.
            </p>

            <form [formGroup]="forceForm" (ngSubmit)="executeForceAction()">
              <label for="fReason">Reason for Administrative Override</label>
              <textarea
                id="fReason"
                rows="3"
                formControlName="reason"
                placeholder="Required documentation for forced status transition..."
              ></textarea>
              @if (forceForm.controls.reason.touched && forceForm.controls.reason.invalid) {
                <span class="field-error">Reason is required.</span>
              }

              <div class="modal-actions">
                <button type="button" class="btn btn-neutral" [disabled]="isSubmittingModal()" (click)="forceTargetUser.set(null)">Cancel</button>
                <button
                  type="submit"
                  [class]="forceAction() === 'opt-out' ? 'btn btn-danger' : 'btn btn-primary'"
                  [disabled]="isSubmittingModal() || forceForm.invalid"
                >
                  {{ isSubmittingModal() ? 'Processing…' : 'Confirm Force Action' }}
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
    .page-header h1 { font-size: 1.5rem; margin-bottom: var(--space-1); }
    .subtitle { color: var(--color-ink-muted); font-size: 0.9375rem; margin: 0; }

    .table-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    .data-table th { background: var(--color-bg); padding: var(--space-3); font-weight: 600; color: var(--color-ink-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
    .data-table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border); vertical-align: middle; }

    .sub-email { font-size: 0.75rem; }
    .role-tag { font-family: monospace; font-size: 0.8125rem; font-weight: 600; }
    .action-cell { display: flex; gap: var(--space-2); align-items: center; }

    .btn-link { background: none; border: none; padding: 0; font-size: 0.8125rem; color: var(--color-accent); cursor: pointer; text-decoration: none; font-weight: 500; }
    .btn-link.warn { color: #b45309; }
    .btn-link.safe { color: #0f766e; }

    .badge { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 999px; display: inline-block; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }
    .badge-opted-in { background: #ecfdf5; color: #065f46; }
    .badge-opted-out { background: #fff7ed; color: #9a3412; }

    .btn { padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-weight: 600; cursor: pointer; border: 1px solid transparent; font-size: 0.875rem; }
    .btn-primary { background: var(--color-accent); color: var(--color-accent-ink); }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-neutral { background: var(--color-surface); border-color: var(--color-border); color: var(--color-ink); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .checkbox-row { display: flex; align-items: center; gap: var(--space-2); margin: var(--space-3) 0; }
    .checkbox-label { font-size: 0.875rem; font-weight: normal; margin: 0; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); max-width: 480px; width: 100%; padding: var(--space-4); }
    .modal-card h2 { font-size: 1.125rem; margin: 0 0 var(--space-2); }
    .modal-desc { font-size: 0.8125rem; color: var(--color-ink-muted); margin-bottom: var(--space-3); line-height: 1.4; }
    label { display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px; }
    input, select, textarea { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.875rem; margin-bottom: var(--space-3); box-sizing: border-box; background: var(--color-surface); }
    .field-error { color: var(--color-danger); font-size: 0.8125rem; display: block; margin-top: -8px; margin-bottom: var(--space-2); }
    .modal-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }

    .state-card { padding: var(--space-6); text-align: center; color: var(--color-ink-muted); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--color-border); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto var(--space-2); }
    @keyframes spin { to { transform: rotate(360deg); } }

    .banner { padding: var(--space-3); border-radius: var(--radius); margin-bottom: var(--space-3); font-size: 0.875rem; }
    .banner-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
    .banner-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .banner p { margin: 0; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(AdminUsersApiService);

  readonly users = signal<AdminUserResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly isCreateModalOpen = signal(false);
  readonly editingUser = signal<AdminUserResponse | null>(null);
  readonly forceTargetUser = signal<AdminUserResponse | null>(null);
  readonly forceAction = signal<'opt-in' | 'opt-out' | null>(null);
  readonly isSubmittingModal = signal(false);

  readonly managerList = computed(() => {
    return this.users().filter((u) => u.role === 'Manager' && u.isActive);
  });

  readonly availableManagersForEdit = computed(() => {
    const editId = this.editingUser()?.id;
    return this.managerList().filter((m) => m.id !== editId); // Prevents self-manager selection
  });

  protected readonly createForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fullName: ['', Validators.required],
    role: ['Employee' as UserRole, Validators.required],
    managerId: [null as string | null]
  });

  protected readonly editForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    role: ['Employee' as UserRole, Validators.required],
    isActive: [true, Validators.required],
    managerId: [null as string | null]
  });

  protected readonly forceForm = this.fb.nonNullable.group({
    reason: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersApi.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err: AppError) => {
        this.errorMessage.set(err.detail || 'Failed to load users.');
        this.isLoading.set(false);
      }
    });
  }

  getManagerName(managerId: string | null): string {
    if (!managerId) return '—';
    const m = this.users().find((u) => u.id === managerId);
    return m ? m.fullName : 'Unknown';
  }

  openCreateModal(): void {
    this.createForm.reset({
      email: '',
      password: '',
      fullName: '',
      role: 'Employee',
      managerId: null
    });
    this.isCreateModalOpen.set(true);
  }

  saveCreateUser(): void {
    if (this.createForm.invalid) return;

    this.isSubmittingModal.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.usersApi.create(this.createForm.getRawValue()).subscribe({
      next: (u) => {
        this.isSubmittingModal.set(false);
        this.isCreateModalOpen.set(false);
        this.successMessage.set(`User "${u.fullName}" created.`);
        this.loadUsers();
      },
      error: (err: AppError) => {
        this.isSubmittingModal.set(false);
        this.errorMessage.set(err.detail || 'Failed to create user.');
      }
    });
  }

  openEditModal(u: AdminUserResponse): void {
    this.editingUser.set(u);
    this.editForm.patchValue({
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      managerId: u.managerId
    });
  }

  saveEditUser(): void {
    const user = this.editingUser();
    if (!user || this.editForm.invalid) return;

    this.isSubmittingModal.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.usersApi.update(user.id, this.editForm.getRawValue()).subscribe({
      next: (u) => {
        this.isSubmittingModal.set(false);
        this.editingUser.set(null);
        this.successMessage.set(`User "${u.fullName}" updated.`);
        this.loadUsers();
      },
      error: (err: AppError) => {
        this.isSubmittingModal.set(false);
        this.errorMessage.set(err.detail || 'Failed to update user.');
      }
    });
  }

  openForceModal(u: AdminUserResponse, action: 'opt-in' | 'opt-out'): void {
    this.forceTargetUser.set(u);
    this.forceAction.set(action);
    this.forceForm.reset({ reason: '' });
  }

  executeForceAction(): void {
    const user = this.forceTargetUser();
    const action = this.forceAction();
    if (!user || !action || this.forceForm.invalid) return;

    this.isSubmittingModal.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const call$ = action === 'opt-in'
      ? this.usersApi.forceOptIn(user.id, this.forceForm.getRawValue())
      : this.usersApi.forceOptOut(user.id, this.forceForm.getRawValue());

    call$.subscribe({
      next: () => {
        this.isSubmittingModal.set(false);
        this.forceTargetUser.set(null);
        this.successMessage.set(`User ${user.fullName} participation status forced to ${action === 'opt-in' ? 'Opted In' : 'Opted Out'}.`);
        this.loadUsers();
      },
      error: (err: AppError) => {
        this.isSubmittingModal.set(false);
        this.errorMessage.set(err.detail || 'Force participation action failed.');
      }
    });
  }
}