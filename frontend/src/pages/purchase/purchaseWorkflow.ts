import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';
import type { PurchaseMetrics } from './purchaseDashboardMetrics';

export const PURCHASE_FEATURES: FeatureItem[] = [
  {
    icon: 'file',
    title: 'Limited quotation (≥3)',
    description: 'Non-tender buys invite at least three empaneled vendors before award.',
  },
  {
    icon: 'chart',
    title: 'Comparative L1 award',
    description: 'Side-by-side RFQ comparison with L1 recommendation and justification trail.',
  },
  {
    icon: 'clock',
    title: 'MSME 45-day payment',
    description: 'Tracks MSME due dates and flags bills inside the statutory payment window.',
  },
  {
    icon: 'mapPin',
    title: 'GST place-of-supply',
    description: 'IGST/CGST-SGST computed from vendor vs institution place of supply.',
  },
  {
    icon: 'wallet',
    title: 'TDS auto-deduction',
    description: 'Section-wise TDS (194C/J/I/Q) with lower-deduction certificate rates.',
  },
  {
    icon: 'refresh',
    title: 'Proprietary / repeat order',
    description: 'Controlled single-source and repeat-order paths with audit notes.',
  },
];

export const PURCHASE_LINKS = [
  { to: '/purchase/requisitions', label: 'Purchase Requisitions', hint: 'Raise & approve departmental needs' },
  { to: '/purchase/quotations', label: 'Quotations', hint: 'RFQ send-out & comparative' },
  { to: '/purchase/orders', label: 'Purchase Orders', hint: 'Issue, amend & track POs' },
  { to: '/purchase/bills', label: 'Bills', hint: '3-way match & MSME payment' },
];

export function purchaseWorkflowSteps(m: PurchaseMetrics): WorkflowStep[] {
  return [
    {
      label: 'Indent',
      description: 'Department request & approval',
      status: m.openIndents > 0 ? 'current' : 'done',
      count: m.openIndents,
    },
    {
      label: 'RFQ / Comparative',
      description: 'Invite vendors, L1 award',
      status: m.pendingQuotations > 0 ? 'current' : m.openIndents > 0 ? 'upcoming' : 'done',
      count: m.pendingQuotations,
    },
    {
      label: 'PO',
      description: 'Issue purchase order',
      status: m.posAwaitingGrn > 0 ? 'current' : 'upcoming',
      count: m.posAwaitingGrn,
    },
    {
      label: 'GRN / QC',
      description: 'Receive & quality check',
      status: m.grnCount > 0 ? 'done' : 'upcoming',
      count: m.grnCount,
    },
    {
      label: 'Bill / 3-way',
      description: 'Match PO · GRN · invoice',
      status: m.billsPendingApproval > 0 ? 'current' : 'upcoming',
      count: m.billsPendingApproval,
    },
    {
      label: 'Payment',
      description: 'Release & MSME window',
      status: m.billsReady > 0 ? 'current' : 'upcoming',
      count: m.billsReady,
    },
  ];
}
