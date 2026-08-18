export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_duty' | 'holiday' | 'week_off' | 'leave';
export type AttendanceSource = 'biometric' | 'web' | 'manual' | 'geo';
export type LeaveAppStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';

export interface ShiftOut {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  is_night: boolean;
  institution_id: string;
}

export interface AttendanceOut {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  shift_code: string;
  in_time: string | null;
  out_time: string | null;
  status: AttendanceStatus;
  late_minutes: number;
  early_minutes: number;
  source: AttendanceSource;
  campus_id: string | null;
  institution_id: string;
}

export interface LeaveTypeOut {
  id: string;
  code: string;
  name: string;
  paid: boolean;
  accrual_per_year: number;
  max_carry_forward: number;
  encashable: boolean;
  gender_restriction: string | null;
  requires_document: boolean;
}

export interface LeaveBalanceOut {
  id: string;
  employee_id: string;
  leave_type_code: string;
  opening: number;
  accrued: number;
  availed: number;
  balance: number;
  year: number;
}

export interface LeaveApplicationOut {
  id: string;
  employee_id: string;
  leave_type_code: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  status: LeaveAppStatus;
  approver_name: string;
  substitute_name: string;
  institution_id: string;
  created_at: string;
}

export interface LeaveApplicationCreate {
  employee_id: string;
  leave_type_code: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  substitute_name: string;
  institution_id: string;
}

export interface AttendanceDashboard {
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  pending_regularisations: number;
}
