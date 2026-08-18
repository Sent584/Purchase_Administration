import { api } from './api';
import type {
  AccountOut,
  AccountsDashboard,
  BankAccountOut,
  BudgetOut,
  CostCentreOut,
  TrialBalanceRow,
  VoucherCreateInput,
  VoucherOut,
} from '../types/accounts';

export const accountsApi = {
  dashboard: (institutionId?: string) =>
    api.get<AccountsDashboard>('/accounts/dashboard', { params: { institution_id: institutionId } }).then((r) => r.data),
  chartOfAccounts: (institutionId?: string) =>
    api.get<AccountOut[]>('/accounts/chart-of-accounts', { params: { institution_id: institutionId } }).then((r) => r.data),
  costCentres: (institutionId?: string) =>
    api.get<CostCentreOut[]>('/accounts/cost-centres', { params: { institution_id: institutionId } }).then((r) => r.data),
  budgets: (institutionId?: string, fy?: string) =>
    api.get<BudgetOut[]>('/accounts/budgets', { params: { institution_id: institutionId, fy } }).then((r) => r.data),
  banks: (institutionId?: string) =>
    api.get<BankAccountOut[]>('/accounts/banks', { params: { institution_id: institutionId } }).then((r) => r.data),
  vouchers: (institutionId?: string, status?: string) =>
    api.get<VoucherOut[]>('/accounts/vouchers', { params: { institution_id: institutionId, status } }).then((r) => r.data),
  createVoucher: (payload: VoucherCreateInput) => api.post<VoucherOut>('/accounts/vouchers', payload).then((r) => r.data),
  validateVoucher: (id: string) => api.post<VoucherOut>(`/accounts/vouchers/${id}/validate`).then((r) => r.data),
  approveVoucher: (id: string) => api.post<VoucherOut>(`/accounts/vouchers/${id}/approve`).then((r) => r.data),
  postVoucher: (id: string) => api.post<VoucherOut>(`/accounts/vouchers/${id}/post`).then((r) => r.data),
  reverseVoucher: (id: string) => api.post<VoucherOut>(`/accounts/vouchers/${id}/reverse`).then((r) => r.data),
  trialBalance: (institutionId?: string) =>
    api.get<TrialBalanceRow[]>('/accounts/trial-balance', { params: { institution_id: institutionId } }).then((r) => r.data),
};
