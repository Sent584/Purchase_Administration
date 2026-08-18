import { api } from './api';
import type { FeesOverview, StudentFeeDetail, StudentFeeSummary } from '../types/fees';

export interface StudentFeeFilters {
  campus?: string;
  division?: string;
  department?: string;
  batch?: string;
  search?: string;
}

export const feesApi = {
  overview: () => api.get<FeesOverview>('/fees/overview').then((r) => r.data),
  students: (filters: StudentFeeFilters = {}) =>
    api.get<StudentFeeSummary[]>('/fees/students', { params: filters }).then((r) => r.data),
  student: (studentId: string) =>
    api.get<StudentFeeDetail>(`/fees/students/${encodeURIComponent(studentId)}`).then((r) => r.data),
};
