import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';

export function payrollWorkflowSteps(pendingApproval: number, latestStatus: string | null): WorkflowStep[] {
  const status = (latestStatus ?? '').toLowerCase();
  const locked = status.includes('lock') || status.includes('paid') || status.includes('posted');
  const approved = locked || status.includes('approv');
  const reviewing = status.includes('review') || status.includes('calc');

  return [
    { label: 'Open', description: 'Create monthly run', status: 'done' },
    { label: 'Attendance', description: 'Import punches & leave', status: 'done' },
    { label: 'Earnings', description: 'Basic, DA, allowances', status: reviewing ? 'current' : 'done' },
    {
      label: 'Statutory',
      description: 'EPF / ESI / PT / TDS',
      status: reviewing ? 'current' : approved ? 'done' : 'upcoming',
    },
    { label: 'Review', description: 'Exception & variance', status: reviewing ? 'current' : approved ? 'done' : 'upcoming' },
    {
      label: 'Approve',
      description: 'HR / Finance sign-off',
      status: pendingApproval > 0 ? 'current' : approved ? 'done' : 'upcoming',
      count: pendingApproval,
    },
    { label: 'Lock', description: 'Freeze inputs', status: locked ? 'done' : 'upcoming' },
    { label: 'Bank advice', description: 'NEFT / RTGS file', status: locked ? 'done' : 'upcoming' },
    { label: 'Payslips', description: 'ESS publish', status: locked ? 'done' : 'upcoming' },
    { label: 'Post', description: 'Journal to Accounts', status: status.includes('post') ? 'done' : 'upcoming' },
  ];
}

export const PAYROLL_FEATURES: FeatureItem[] = [
  {
    icon: 'star',
    title: 'UGC pay levels',
    description: 'Academic pay matrices and grade-pay mappings for faculty cadres.',
  },
  {
    icon: 'settings',
    title: 'Formula builder',
    description: 'Configurable earning/deduction formulas without code changes.',
  },
  {
    icon: 'file',
    title: 'Form 16 / 24Q',
    description: 'Annual Form 16 generation and quarterly TDS return support.',
  },
  {
    icon: 'refresh',
    title: 'Arrears & revisions',
    description: 'DA / pay-revision arrears with retrospective recalculation.',
  },
  {
    icon: 'wallet',
    title: 'Loans recovery',
    description: 'EMI schedules for advances and loans with auto recovery.',
  },
];

export const PAYROLL_LINKS = [
  { to: '/payroll/runs', label: 'Payroll runs', hint: 'Open, calculate & lock cycles' },
  { to: '/payroll/payslips', label: 'Payslips', hint: 'Employee-wise slip archive' },
  { to: '/attendance', label: 'Attendance', hint: 'Feed for attendance import' },
  { to: '/accounts', label: 'Accounts', hint: 'Post salary journals' },
];
