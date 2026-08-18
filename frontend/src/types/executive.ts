export interface OrgMetricPoint {
  name: string;
  spend: number;
  headcount: number;
  pending_approvals: number;
  stock_value: number;
}

export interface FunctionPulse {
  key: string;
  label: string;
  primary: string;
  secondary: string;
  tone: string;
  href: string;
}

export interface ExecutiveOverview {
  institutions: number;
  campuses: number;
  divisions: number;
  departments: number;
  headcount: number;
  po_spend: number;
  cash_position: number;
  stock_value: number;
  asset_book: number;
  pending_approvals: number;
  attendance_pct: number;
  budget_pct: number;
  by_campus: OrgMetricPoint[];
  by_division: OrgMetricPoint[];
  by_department: OrgMetricPoint[];
  functions: FunctionPulse[];
}

export interface ApprovalItem {
  id: string;
  domain: string;
  title: string;
  subtitle: string;
  amount?: number | null;
  campus_name: string;
  division_name: string;
  department_name: string;
  status: string;
  created_at?: string | null;
  href: string;
  action: string;
  permission: string;
}

export interface ApprovalsInbox {
  total: number;
  items: ApprovalItem[];
}
