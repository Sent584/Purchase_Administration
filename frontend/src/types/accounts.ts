export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type VoucherType = 'journal' | 'receipt' | 'payment' | 'contra' | 'purchase' | 'payroll' | 'debit_note' | 'credit_note';
export type VoucherStatus = 'draft' | 'validated' | 'approved' | 'posted' | 'reversed';

export interface AccountOut {
  id: string;
  code: string;
  name: string;
  account_type: AccountType;
  parent_code: string | null;
  is_control: boolean;
  institution_id: string;
}

export interface CostCentreOut {
  id: string;
  code: string;
  name: string;
  institution_id: string;
  campus_id: string | null;
}

export interface BudgetOut {
  id: string;
  fy: string;
  account_code: string;
  account_name: string;
  cost_centre_code: string;
  allocated: number;
  committed: number;
  actual: number;
  available: number;
  institution_id: string;
}

export interface VoucherLine {
  account_code: string;
  cost_centre: string;
  debit: number;
  credit: number;
}

export interface VoucherOut {
  id: string;
  voucher_number: string;
  voucher_type: VoucherType;
  date: string;
  narration: string;
  lines: VoucherLine[];
  status: VoucherStatus;
  total_debit: number;
  total_credit: number;
  institution_id: string;
  created_by_name: string;
}

export interface VoucherCreateInput {
  institution_id: string;
  voucher_type: VoucherType;
  date?: string;
  narration: string;
  lines: VoucherLine[];
  created_by_name: string;
}

export interface BankAccountOut {
  id: string;
  bank_name: string;
  account_number_masked: string;
  ifsc: string;
  account_type: string;
  institution_id: string;
  current_balance: number;
}

export interface TrialBalanceRow {
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
}

export interface AccountsDashboard {
  cash_position: number;
  budget_utilised_pct: number;
  pending_vouchers: number;
  posted_vouchers: number;
  bank_accounts: number;
  fy_label: string;
}
