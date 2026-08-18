import { api } from './api';
import type { GlobalConfigOut } from '../types/api';

export const configApi = {
  get: () => api.get<GlobalConfigOut>('/config').then((r) => r.data),
  update: (patch: Record<string, unknown>) => api.put<GlobalConfigOut>('/config', patch).then((r) => r.data),
};
