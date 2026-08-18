import { api } from './api';
import type {
  AssetCreateInput,
  AssetDisposeInput,
  AssetOut,
  AssetProcurement,
  AssetsDashboard,
  AssetTransferInput,
} from '../types/assets';

export const assetsApi = {
  dashboard: (institutionId?: string) =>
    api.get<AssetsDashboard>('/assets/dashboard', { params: { institution_id: institutionId } }).then((r) => r.data),

  list: (params?: {
    institution_id?: string;
    asset_class?: string;
    status?: string;
    campus_id?: string;
    division_id?: string;
    department_id?: string;
  }) => api.get<AssetOut[]>('/assets', { params }).then((r) => r.data),

  get: (id: string) => api.get<AssetOut>(`/assets/${id}`).then((r) => r.data),

  procurement: (id: string) =>
    api.get<AssetProcurement>(`/assets/${id}/procurement`).then((r) => r.data),

  create: (payload: AssetCreateInput) => api.post<AssetOut>('/assets', payload).then((r) => r.data),

  update: (id: string, patch: Partial<AssetOut>) => api.patch<AssetOut>(`/assets/${id}`, patch).then((r) => r.data),

  transfer: (id: string, payload: AssetTransferInput) =>
    api.post<AssetOut>(`/assets/${id}/transfer`, payload).then((r) => r.data),

  dispose: (id: string, payload: AssetDisposeInput) =>
    api.post<AssetOut>(`/assets/${id}/dispose`, payload).then((r) => r.data),
};
