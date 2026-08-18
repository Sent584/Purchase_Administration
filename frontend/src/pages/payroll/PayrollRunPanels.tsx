import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ErrorBanner } from '../../components/ui/Feedback';
import { Icon } from '../../components/ui/Icon';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';
import type { PayrollRunOut, PayrollRunStatus } from '../../types/payroll';
import { formatInr, monthName, runStatusTone } from './payrollHelpers';

const ORDER: PayrollRunStatus[] = ['draft', 'processing', 'review', 'approved', 'locked'];

export function payrollWorkflowSteps(run: PayrollRunOut | null): WorkflowStep[] {
  const status = run?.status ?? 'draft';
  const idx = ORDER.indexOf(status === 'posted' ? 'locked' : status);
  const labels = [
    { label: 'Draft', description: 'Period opened' },
    { label: 'Process', description: 'Compute payslips' },
    { label: 'Review', description: 'Finance checks' },
    { label: 'Approve', description: 'Authorise net pay' },
    { label: 'Lock', description: 'Immutable cycle' },
  ];
  return labels.map((l, i) => ({
    ...l,
    status: i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  }));
}

export function PayrollActionChecklist({
  selected,
  actionError,
  canWrite,
  canApprove,
  processPending,
  approvePending,
  lockPending,
  onProcess,
  onApprove,
  onLock,
}: {
  selected: PayrollRunOut;
  actionError: string | null;
  canWrite: boolean;
  canApprove: boolean;
  processPending: boolean;
  approvePending: boolean;
  lockPending: boolean;
  onProcess: () => void;
  onApprove: () => void;
  onLock: () => void;
}) {
  const steps = [
    { key: 'process', label: '1. Process', done: !['draft', 'processing'].includes(selected.status), active: selected.status === 'draft' || selected.status === 'processing', show: canWrite, pending: processPending, action: onProcess },
    { key: 'approve', label: '2. Approve', done: ['approved', 'locked', 'posted'].includes(selected.status), active: selected.status === 'review', show: canApprove, pending: approvePending, action: onApprove },
    { key: 'lock', label: '3. Lock', done: selected.status === 'locked' || selected.status === 'posted', active: selected.status === 'approved', show: canApprove, pending: lockPending, action: onLock },
  ];

  return (
    <Card className="h-fit">
      <CardHeader><CardTitle>Run actions</CardTitle></CardHeader>
      <CardBody className="space-y-3 text-sm">
        {actionError && <ErrorBanner message={actionError} />}
        <p className="font-medium text-ink-900">{monthName(selected.period_month)} {selected.period_year}</p>
        <p className="text-ink-500">Net {formatInr(selected.net_total)} · {selected.employee_count} employees</p>
        <Badge tone={runStatusTone(selected.status)}>{selected.status}</Badge>
        <ul className="space-y-2 border-t border-ink-100 pt-3">
          {steps.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-2">
              <span className={s.done ? 'text-emerald-700' : s.active ? 'font-medium text-ink-900' : 'text-ink-400'}>
                {s.done ? '✓ ' : ''}{s.label}
              </span>
              {s.show && s.active && !s.done && (
                <Button size="sm" loading={s.pending} onClick={s.action}>{s.label.replace(/^\d+\.\s*/, '')}</Button>
              )}
            </li>
          ))}
        </ul>
        <Link to={`/payroll/payslips?run=${selected.id}`} className="block text-sm font-medium text-crimson-700 hover:underline">
          View payslips →
        </Link>
      </CardBody>
    </Card>
  );
}

export function StatutorySummaryCards() {
  const cards = [
    { icon: 'shield' as const, title: 'EPF wage ceiling', body: 'Employee + employer PF calculated on wages up to ₹15,000 / month (statutory ceiling).' },
    { icon: 'wallet' as const, title: 'ESI threshold', body: 'ESI applies when gross wages are ≤ ₹21,000 / month; higher earners are excluded.' },
    { icon: 'file' as const, title: 'TN Professional Tax', body: 'Tamil Nadu PT is assessed half-yearly; deductions sync with salary cycles before remittance.' },
  ];
  return (
    <Card>
      <CardHeader><CardTitle>Indian statutory summary</CardTitle></CardHeader>
      <CardBody className="space-y-3">
        {cards.map((c) => (
          <div key={c.title} className="flex gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-crimson-700 shadow-sm">
              <Icon name={c.icon} className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-900">{c.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{c.body}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
