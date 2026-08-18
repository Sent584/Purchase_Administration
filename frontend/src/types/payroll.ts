export type ComponentType = 'earning' | 'deduction' | 'employer';
export type PayrollRunStatus = 'draft' | 'processing' | 'review' | 'approved' | 'locked' | 'posted';

export interface PayComponentOut {
  id: string;
  code: string;
  name: string;
  type: ComponentType;
  taxable: boolean;
  statutory_code: string;
  formula_hint: string;
}

export interface SalaryStructureOut {
  id: string;
  employee_id: string | null;
  pay_level: string | null;
  components: { code: string; amount: number }[];
  effective_from: string;
  institution_id: string;
}

export interface PayrollRunOut {
  id: string;
  period_year: number;
  period_month: number;
  institution_id: string;
  status: PayrollRunStatus;
  employee_count: number;
  gross_total: number;
  deduction_total: number;
  net_total: number;
  employer_contrib_total: number;
  created_at: string;
}

export interface PayslipOut {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  employer: Record<string, number>;
  gross: number;
  total_deductions: number;
  net: number;
  days_paid: number;
  lop_days: number;
  ytd_gross: number;
  ytd_tax: number;
  bank_last4: string;
  status: string;
  institution_id: string;
}

export interface PayrollDashboard {
  runs_this_fy: number;
  latest_run_status: string | null;
  employees_paid_last_run: number;
  net_paid_last_run: number;
  pending_approval: number;
}
