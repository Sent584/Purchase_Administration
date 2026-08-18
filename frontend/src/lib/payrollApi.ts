import { api } from './api';
import type { PayComponentOut, PayrollDashboard, PayrollRunOut, PayslipOut, SalaryStructureOut } from '../types/payroll';

export const payrollApi = {
  dashboard: (institutionId?: string) =>
    api.get<PayrollDashboard>('/payroll/dashboard', { params: { institution_id: institutionId } }).then((r) => r.data),
  components: () => api.get<PayComponentOut[]>('/payroll/components').then((r) => r.data),
  structures: (institutionId?: string) =>
    api.get<SalaryStructureOut[]>('/payroll/structures', { params: { institution_id: institutionId } }).then((r) => r.data),
  listRuns: (institutionId?: string) =>
    api.get<PayrollRunOut[]>('/payroll/runs', { params: { institution_id: institutionId } }).then((r) => r.data),
  createRun: (payload: { period_year: number; period_month: number; institution_id: string }) =>
    api.post<PayrollRunOut>('/payroll/runs', payload).then((r) => r.data),
  processRun: (id: string) => api.post<PayrollRunOut>(`/payroll/runs/${id}/process`).then((r) => r.data),
  approveRun: (id: string) => api.post<PayrollRunOut>(`/payroll/runs/${id}/approve`).then((r) => r.data),
  lockRun: (id: string) => api.post<PayrollRunOut>(`/payroll/runs/${id}/lock`).then((r) => r.data),
  listPayslips: (runId?: string, institutionId?: string) =>
    api
      .get<PayslipOut[]>('/payroll/payslips', { params: { run_id: runId, institution_id: institutionId } })
      .then((r) => r.data),
  getPayslip: (id: string) => api.get<PayslipOut>(`/payroll/payslips/${id}`).then((r) => r.data),
};
