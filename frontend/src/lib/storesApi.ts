import { api } from './api';
import type {
  StockBalanceOut,
  StockTxnCreateInput,
  StockTxnOut,
  StoreCreateInput,
  StoreOut,
  StoresDashboard,
} from '../types/stores';

export type StockListFilters = {
  institutionId?: string;
  storeId?: string;
  campusId?: string;
  divisionId?: string;
  departmentId?: string;
  txnType?: string;
};

export const storesApi = {
  list: (institutionId?: string, campusId?: string) =>
    api
      .get<StoreOut[]>('/stores/stores', {
        params: { institution_id: institutionId, campus_id: campusId },
      })
      .then((r) => r.data),
  get: (id: string) => api.get<StoreOut>(`/stores/stores/${id}`).then((r) => r.data),
  create: (payload: StoreCreateInput) => api.post<StoreOut>('/stores/stores', payload).then((r) => r.data),
  update: (id: string, patch: Partial<StoreCreateInput> & { status?: string }) =>
    api.patch<StoreOut>(`/stores/stores/${id}`, patch).then((r) => r.data),
};

export const stockApi = {
  balances: (filters: StockListFilters = {}) =>
    api
      .get<StockBalanceOut[]>('/stores/stock', {
        params: {
          institution_id: filters.institutionId,
          store_id: filters.storeId,
          campus_id: filters.campusId,
          division_id: filters.divisionId,
          department_id: filters.departmentId,
        },
      })
      .then((r) => r.data),
  transactions: (filters: StockListFilters = {}) =>
    api
      .get<StockTxnOut[]>('/stores/transactions', {
        params: {
          institution_id: filters.institutionId,
          store_id: filters.storeId,
          txn_type: filters.txnType,
          campus_id: filters.campusId,
          division_id: filters.divisionId,
          department_id: filters.departmentId,
        },
      })
      .then((r) => r.data),
  post: (payload: StockTxnCreateInput) => api.post<StockTxnOut>('/stores/transactions', payload).then((r) => r.data),
  dashboard: (institutionId?: string) =>
    api.get<StoresDashboard>('/stores/dashboard', { params: { institution_id: institutionId } }).then((r) => r.data),
};
