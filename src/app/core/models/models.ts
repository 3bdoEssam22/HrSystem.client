export type UserRole = 'Employee' | 'Manager' | 'Admin';
export type LeaveType = 'Vacation' | 'DayOff' | 'SickLeave';
export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type ParticipationStatus = 'OptedIn' | 'OptedOut';

// data? — not data: T — because the backend's non-generic GenericResponse omits the "data" key
// entirely on actions with no payload (opt-in, cancel, approve, ...), it isn't just null.
export interface GenericResponse<T = void> {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  errorType: string;
  validationErrors: Record<string, string[]> | null;
  data?: T;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

// What error.interceptor.ts normalizes every failed HTTP call into — components only ever deal
// with this shape, never the raw Problem Details JSON.
export interface AppError {
  status: number;
  detail: string;
  errorCode: string | null;
  validationErrors: Record<string, string[]> | null;
}

export interface CurrentUser { userId: string; fullName: string; role: UserRole; }

// --- Auth ---
export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { token: string; userId: string; fullName: string; role: UserRole; }
export interface UserProfileResponse { id: string; email: string; fullName: string; role: UserRole; participationStatus: ParticipationStatus; }

// --- Participation ---
export interface ParticipationStatusResponse { status: ParticipationStatus; lastOptOutAt: string | null; eligibleToOptInOn: string | null; }

// --- My Leave ---
export interface CreateLeaveRequestRequest { type: LeaveType; startDate: string; endDate: string; }
export interface UpdateLeaveRequestRequest { startDate: string; endDate: string; }
export interface LeaveRequestResponse {
  id: string; type: LeaveType; startDate: string; endDate: string; chargeableBusinessDays: number;
  status: LeaveRequestStatus; submittedAt: string; updatedAt: string | null; decidedAt: string | null; decisionReason: string | null;
}
export interface LeaveBalanceResponse { type: LeaveType; annualAllowanceDays: number; reservedDays: number; remainingDays: number; }

// --- Manager / Admin request queues ---
export interface RejectRequestBody { reason: string | null; }
export interface LeaveRequestWithEmployeeResponse extends LeaveRequestResponse { employeeId: string; employeeFullName: string; }

// --- Admin: Policies ---
export interface UpdateLeavePolicyRequest { annualAllowanceDays: number; maxConsecutiveBusinessDays: number | null; minNoticeDays: number | null; backdateDays: number | null; }
export interface LeavePolicyResponse {
  id: string; type: LeaveType; version: number; enabled: boolean; annualAllowanceDays: number;
  maxConsecutiveBusinessDays: number | null; minNoticeDays: number | null; backdateDays: number | null;
  isCurrent: boolean; createdAt: string; supersededAt: string | null;
}

// --- Admin: Holidays ---
export interface CreateHolidayRequest { date: string; name: string; }
export interface UpdateHolidayRequest { date: string; name: string; }
export interface HolidayResponse { id: string; date: string; name: string; }

// --- Admin: Users ---
export interface CreateUserRequest { email: string; password: string; fullName: string; role: UserRole; managerId: string | null; }
export interface UpdateUserRequest { fullName: string; role: UserRole; isActive: boolean; managerId: string | null; }
export interface ForceParticipationRequest { reason: string; }
export interface AdminUserResponse { id: string; email: string; fullName: string; role: UserRole; isActive: boolean; managerId: string | null; participationStatus: ParticipationStatus; }

// --- Admin: Participation Settings ---
export interface ParticipationSettingsResponse { defaultStatus: ParticipationStatus; allowEmployeeSelfOptOut: boolean; reOptInCooldownDays: number; }
export interface UpdateParticipationSettingsRequest { defaultStatus: ParticipationStatus; allowEmployeeSelfOptOut: boolean; reOptInCooldownDays: number; }