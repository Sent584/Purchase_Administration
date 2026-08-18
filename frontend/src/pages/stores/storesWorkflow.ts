import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';

export function storesWorkflowSteps(belowReorder: number, pendingIssues: number): WorkflowStep[] {
  return [
    { label: 'Opening / GRN', description: 'Opening stock & receipts', status: 'done' },
    { label: 'Putaway', description: 'Bin / location assignment', status: 'done' },
    {
      label: 'Issue',
      description: 'Department indents',
      status: pendingIssues > 0 ? 'current' : 'upcoming',
      count: pendingIssues,
    },
    { label: 'Transfer', description: 'Inter-store movement', status: 'upcoming' },
    {
      label: 'Adjustment',
      description: 'Write-off & corrections',
      status: belowReorder > 0 ? 'current' : 'upcoming',
      count: belowReorder,
    },
    { label: 'Physical verify', description: 'Cycle count & variance', status: 'upcoming' },
  ];
}

export const STORES_FEATURES: FeatureItem[] = [
  {
    icon: 'refresh',
    title: 'FIFO / FEFO',
    description: 'Batch and expiry-aware issue valuation for consumables.',
  },
  {
    icon: 'alert',
    title: 'Negative-stock prevention',
    description: 'Blocks issues that would drive on-hand below zero.',
  },
  {
    icon: 'chart',
    title: 'ABC classification',
    description: 'Value-based item ranking for cycle-count priority.',
  },
  {
    icon: 'shield',
    title: 'MSDS for chemicals',
    description: 'Safety data sheets linked to lab chemical SKUs.',
  },
];

export const STORES_LINKS = [
  { to: '/stores/list', label: 'Stores', hint: 'Campus store master' },
  { to: '/stores/stock', label: 'Stock ledger', hint: 'Balances & valuation' },
  { to: '/stores/issues', label: 'Issues', hint: 'Pending & posted issues' },
  { to: '/purchase/orders', label: 'Purchase', hint: 'GRN from open POs' },
];
