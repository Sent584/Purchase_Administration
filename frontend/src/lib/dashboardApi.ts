import { api } from './api';
import type { RoleHomeDashboard } from '../types/roleHome';

export const dashboardApi = {
  home: () => api.get<RoleHomeDashboard>('/dashboard/home').then((r) => r.data),
};
