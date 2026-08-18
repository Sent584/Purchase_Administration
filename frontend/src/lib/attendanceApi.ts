import { api } from './api';
import type {
  AttendanceDashboard,
  AttendanceOut,
  LeaveApplicationCreate,
  LeaveApplicationOut,
  LeaveBalanceOut,
  LeaveTypeOut,
  ShiftOut,
} from '../types/attendance';

export const attendanceApi = {
  dashboard: (institutionId?: string) =>
    api.get<AttendanceDashboard>('/attendance/dashboard', { params: { institution_id: institutionId } }).then((r) => r.data),
  listShifts: (institutionId?: string) =>
    api.get<ShiftOut[]>('/attendance/shifts', { params: { institution_id: institutionId } }).then((r) => r.data),
  listRecords: (institutionId?: string, onDate?: string) =>
    api
      .get<AttendanceOut[]>('/attendance/records', { params: { institution_id: institutionId, on_date: onDate } })
      .then((r) => r.data),
  createRecord: (payload: Omit<AttendanceOut, 'id'>) =>
    api.post<AttendanceOut>('/attendance/records', payload).then((r) => r.data),
  leaveTypes: () => api.get<LeaveTypeOut[]>('/attendance/leave-types').then((r) => r.data),
  leaveBalances: (employeeId?: string, year?: number) =>
    api.get<LeaveBalanceOut[]>('/attendance/leave-balances', { params: { employee_id: employeeId, year } }).then((r) => r.data),
  leaveApplications: (institutionId?: string, status?: string) =>
    api
      .get<LeaveApplicationOut[]>('/attendance/leave-applications', { params: { institution_id: institutionId, status } })
      .then((r) => r.data),
  createLeave: (payload: LeaveApplicationCreate) =>
    api.post<LeaveApplicationOut>('/attendance/leave-applications', payload).then((r) => r.data),
  submitLeave: (id: string) => api.post<LeaveApplicationOut>(`/attendance/leave-applications/${id}/submit`).then((r) => r.data),
  approveLeave: (id: string, approverName: string) =>
    api.post<LeaveApplicationOut>(`/attendance/leave-applications/${id}/approve`, { approver_name: approverName }).then((r) => r.data),
  rejectLeave: (id: string, approverName: string) =>
    api.post<LeaveApplicationOut>(`/attendance/leave-applications/${id}/reject`, { approver_name: approverName }).then((r) => r.data),
};
