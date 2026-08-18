import { api } from './api';
import type { RoleOut } from '../types/api';

export const rbacApi = {
  listRoles: () => api.get<RoleOut[]>('/rbac/roles').then((r) => r.data),
  listPermissions: () => api.get<Record<string, string>>('/rbac/permissions').then((r) => r.data),
};
