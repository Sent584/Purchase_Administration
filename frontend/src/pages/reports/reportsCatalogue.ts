import type { FeatureItem } from '../../components/erp/FeatureCatalogue';

export type ReportCategory = 'Purchase' | 'People' | 'Finance' | 'Compliance';

export interface ReportLink {
  title: string;
  description: string;
  path: string;
  permission: string;
  icon: 'chart' | 'users' | 'wallet' | 'box' | 'server' | 'clock' | 'file' | 'shield' | 'cart';
  category: ReportCategory;
}

export const REPORT_CATEGORIES: ReportCategory[] = ['Purchase', 'People', 'Finance', 'Compliance'];

export const REPORTS: ReportLink[] = [
  {
    title: 'Purchase spend & PO register',
    description: 'Vendor-wise spend, open POs and GRN status',
    path: '/purchase',
    permission: 'vendor:read',
    icon: 'cart',
    category: 'Purchase',
  },
  {
    title: 'Stock ledger & reorder',
    description: 'On-hand valuation, below-reorder and movements',
    path: '/stores/stock',
    permission: 'stores:read',
    icon: 'box',
    category: 'Purchase',
  },
  {
    title: 'Fixed asset register',
    description: 'Class-wise book value, AMC and insurance due',
    path: '/assets/register',
    permission: 'assets:read',
    icon: 'server',
    category: 'Purchase',
  },
  {
    title: 'Headcount & manpower',
    description: 'Teaching/non-teaching mix by department',
    path: '/hr',
    permission: 'hr:read',
    icon: 'users',
    category: 'People',
  },
  {
    title: 'Attendance & leave',
    description: 'Daily presence, leave balances and pending approvals',
    path: '/attendance',
    permission: 'attendance:read',
    icon: 'clock',
    category: 'People',
  },
  {
    title: 'Payroll summary',
    description: 'Monthly net pay, statutory contributions and payslips',
    path: '/payroll',
    permission: 'payroll:read',
    icon: 'wallet',
    category: 'People',
  },
  {
    title: 'Student fees overview',
    description: 'Pending dues by programme, year, fee head and due timeline',
    path: '/fees',
    permission: 'accounts:read',
    icon: 'wallet',
    category: 'Finance',
  },
  {
    title: 'Budget vs actual',
    description: 'FY commitments, utilisation and available budget',
    path: '/accounts/budgets',
    permission: 'budget:read',
    icon: 'wallet',
    category: 'Finance',
  },
  {
    title: 'Trial balance',
    description: 'Posted ledger balances drillable to vouchers',
    path: '/accounts/trial-balance',
    permission: 'accounts:read',
    icon: 'chart',
    category: 'Finance',
  },
  {
    title: 'MSME payment window',
    description: 'Bills approaching the 45-day statutory deadline',
    path: '/purchase/bills',
    permission: 'vendor:read',
    icon: 'shield',
    category: 'Compliance',
  },
  {
    title: 'Form 16 / TDS readiness',
    description: 'Payroll TDS and annual certificate preparation',
    path: '/payroll',
    permission: 'payroll:read',
    icon: 'file',
    category: 'Compliance',
  },
];

export const REPORTS_FEATURES: FeatureItem[] = [
  {
    icon: 'chart',
    title: 'Indian numbering',
    description: 'Amounts shown in ₹, lakh and crore formats.',
  },
  {
    icon: 'eye',
    title: 'Permission-filtered',
    description: 'Only reports you are entitled to appear here.',
  },
  {
    icon: 'paperclip',
    title: 'Watermarked exports',
    description: 'Exports are watermarked and audit-logged.',
  },
];
