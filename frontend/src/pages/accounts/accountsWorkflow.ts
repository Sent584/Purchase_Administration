import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';

export function accountsWorkflowSteps(pending: number, posted: number): WorkflowStep[] {
  return [
    {
      label: 'Draft',
      description: 'Capture voucher lines',
      status: pending > 0 ? 'current' : 'done',
      count: pending,
    },
    { label: 'Validate', description: 'Balance & GST/TDS checks', status: pending > 0 ? 'current' : 'done' },
    { label: 'Approve', description: 'Maker-checker approval', status: pending > 0 ? 'upcoming' : 'done' },
    {
      label: 'Post',
      description: 'Immutable GL entry',
      status: posted > 0 ? 'done' : 'upcoming',
      count: posted,
    },
    { label: 'Statements', description: 'TB, P&L, balance sheet', status: posted > 0 ? 'current' : 'upcoming' },
  ];
}

export const ACCOUNTS_FEATURES: FeatureItem[] = [
  {
    icon: 'building',
    title: 'Multi-fund accounting',
    description: 'Separate ledgers for general, hostel, trust and project funds.',
  },
  {
    icon: 'shield',
    title: 'Commitment accounting',
    description: 'Budget reserved at PO stage before cash is spent.',
  },
  {
    icon: 'file',
    title: 'GST / TDS registers',
    description: 'Input/output tax and TDS deductible/collected registers.',
  },
  {
    icon: 'users',
    title: 'Student fee integration',
    description: 'Pending dues analytics and fee receipts posting into the fee control account.',
  },
  {
    icon: 'star',
    title: 'Grants & projects',
    description: 'Restricted grant utilisation with utilisation certificates.',
  },
  {
    icon: 'refresh',
    title: 'Bank reconciliation',
    description: 'Statement import, match and outstanding cheque tracking.',
  },
];

export const ACCOUNTS_LINKS = [
  { to: '/fees', label: 'Student Fees', hint: 'Pending dues & analytics' },
  { to: '/accounts/coa', label: 'Chart of Accounts', hint: 'Heads, groups & funds' },
  { to: '/accounts/vouchers', label: 'Vouchers', hint: 'Draft → approve → post' },
  { to: '/accounts/budgets', label: 'Budgets', hint: 'Allocation & utilisation' },
  { to: '/accounts/trial-balance', label: 'Trial Balance', hint: 'Posted ledger snapshot' },
];
