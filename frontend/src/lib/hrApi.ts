import { api } from './api';
import type {
  DesignationCreateInput,
  DesignationOut,
  EmployeeCreateInput,
  EmployeeOut,
  HrDashboard,
} from '../types/hr';

export const hrApi = {
  dashboard: (institutionId?: string) =>
    api.get<HrDashboard>('/hr/dashboard', { params: { institution_id: institutionId } }).then((r) => r.data),

  listEmployees: (params?: {
    institution_id?: string;
    campus_id?: string;
    division_id?: string;
    department_id?: string;
    category?: string;
    status?: string;
    q?: string;
  }) => api.get<EmployeeOut[]>('/hr/employees', { params }).then((r) => r.data),

  getEmployee: (id: string) => api.get<EmployeeOut>(`/hr/employees/${id}`).then((r) => r.data),

  createEmployee: (payload: EmployeeCreateInput) =>
    api.post<EmployeeOut>('/hr/employees', payload).then((r) => r.data),

  updateEmployee: (id: string, patch: Partial<EmployeeOut>) =>
    api.patch<EmployeeOut>(`/hr/employees/${id}`, patch).then((r) => r.data),

  listDesignations: (institutionId?: string) =>
    api.get<DesignationOut[]>('/hr/designations', { params: { institution_id: institutionId } }).then((r) => r.data),

  createDesignation: (payload: DesignationCreateInput) =>
    api.post<DesignationOut>('/hr/designations', payload).then((r) => r.data),

  updateDesignation: (id: string, patch: Partial<DesignationOut>) =>
    api.patch<DesignationOut>(`/hr/designations/${id}`, patch).then((r) => r.data),
};
