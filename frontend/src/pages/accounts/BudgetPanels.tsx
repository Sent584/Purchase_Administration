import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { FeatureCatalogue } from '../../components/erp/FeatureCatalogue';
import { formatInr } from './accountsHelpers';
import type { BudgetOut } from '../../types/accounts';

export function BudgetCommitmentStrip() {
  return (
    <WorkflowStrip
      title="Commitment stages"
      steps={[
        { label: 'Pre-commit', description: 'Budget reserved', status: 'done' },
        { label: 'Requisition', description: 'Indent raised', status: 'done' },
        { label: 'PO', description: 'Order issued', status: 'current' },
        { label: 'Invoice', description: 'Liability booked', status: 'upcoming' },
        { label: 'Payment', description: 'Cash out', status: 'upcoming' },
        { label: 'Release', description: 'Unused freed', status: 'upcoming' },
      ]}
    />
  );
}

export function BudgetFeatureNotes() {
  return (
    <FeatureCatalogue
      title="Budget controls"
      items={[
        { icon: 'shield', title: 'Freeze', description: 'Finance can freeze a head mid-year so no new commitments are accepted until the freeze is lifted.' },
        { icon: 'refresh', title: 'Reappropriation', description: 'Move available balance between cost centres or heads with an auditable reappropriation voucher.' },
        { icon: 'chart', title: 'Utilisation watch', description: 'Committed + actual must stay within allocated; negative available flags over-commitment.' },
      ]}
    />
  );
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

export function BudgetRowUtilBar({ budget }: { budget: BudgetOut }) {
  const committed = pct(budget.committed, budget.allocated);
  const actual = pct(budget.actual, budget.allocated);
  return (
    <div className="w-28" title={`Committed ${committed}% · Actual ${actual}%`}>
      <div className="h-2 overflow-hidden rounded-full bg-ink-200">
        <div className="relative h-full w-full">
          <div className="absolute inset-y-0 left-0 bg-amber-400/80" style={{ width: `${committed}%` }} />
          <div className="absolute inset-y-0 left-0 bg-crimson-600" style={{ width: `${actual}%` }} />
        </div>
      </div>
      <p className="mt-0.5 text-[10px] text-ink-400">{actual}% used</p>
    </div>
  );
}

export function BudgetUtilisationBars({ budget }: { budget: BudgetOut }) {
  const rows = [
    { label: 'Allocated', value: budget.allocated, tone: 'bg-ink-400', width: 100 },
    { label: 'Committed', value: budget.committed, tone: 'bg-amber-500', width: pct(budget.committed, budget.allocated) },
    { label: 'Actual', value: budget.actual, tone: 'bg-crimson-600', width: pct(budget.actual, budget.allocated) },
    { label: 'Available', value: budget.available, tone: budget.available < 0 ? 'bg-red-600' : 'bg-emerald-500', width: pct(Math.max(0, budget.available), budget.allocated) },
  ];
  return (
    <div className="space-y-2 rounded-lg border border-ink-100 bg-ink-50/50 p-3">
      <p className="text-xs font-semibold text-ink-700">{budget.account_code} · {budget.cost_centre_code}</p>
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-0.5 flex justify-between text-[11px] text-ink-500">
            <span>{r.label}</span>
            <span className="font-medium text-ink-800">{formatInr(r.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
            <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.width}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
