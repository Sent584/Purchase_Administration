import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ErrorBanner } from '../../components/ui/Feedback';
import { Icon } from '../../components/ui/Icon';
import { ApprovalTimeline, type TimelineStep } from '../../components/documents/ApprovalTimeline';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';
import type { VoucherOut, VoucherStatus } from '../../types/accounts';
import { formatInr, voucherStatusTone } from './accountsHelpers';

const ORDER: VoucherStatus[] = ['draft', 'validated', 'approved', 'posted', 'reversed'];

export function voucherWorkflowSteps(status: VoucherStatus | null): WorkflowStep[] {
  const labels = [
    { label: 'Draft', description: 'Entry captured' },
    { label: 'Validate', description: 'Balance check' },
    { label: 'Approve', description: 'Authorisation' },
    { label: 'Post', description: 'Books updated' },
    { label: 'Reverse-only', description: 'No silent edits' },
  ];
  const idx = status ? ORDER.indexOf(status) : 0;
  return labels.map((l, i) => ({
    ...l,
    status: i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  }));
}

export function voucherTimeline(v: VoucherOut): TimelineStep[] {
  const order: VoucherStatus[] = ['draft', 'validated', 'approved', 'posted'];
  const labels = ['Draft created', 'Validated', 'Approved', 'Posted to ledger'];
  const cur = order.indexOf(v.status === 'reversed' ? 'posted' : v.status);
  return labels.map((label, i) => ({
    label,
    status: i < cur ? 'done' : i === cur ? (v.status === 'reversed' && i === 3 ? 'done' : 'current') : 'pending',
    actor: i === 0 ? v.created_by_name : null,
    timestamp: i === 0 ? v.date : null,
  }));
}

export function VoucherDetailPanel({
  selected,
  actionError,
  canWrite,
  canApprove,
  canPost,
  validatePending,
  approvePending,
  postPending,
  onValidate,
  onApprove,
  onPost,
}: {
  selected: VoucherOut;
  actionError: string | null;
  canWrite: boolean;
  canApprove: boolean;
  canPost: boolean;
  validatePending: boolean;
  approvePending: boolean;
  postPending: boolean;
  onValidate: () => void;
  onApprove: () => void;
  onPost: () => void;
}) {
  return (
    <Card className="h-fit">
      <CardHeader><CardTitle>{selected.voucher_number}</CardTitle></CardHeader>
      <CardBody className="space-y-4 text-sm">
        {actionError && <ErrorBanner message={actionError} />}
        <p className="text-ink-500">{selected.narration}</p>
        <p>Debit {formatInr(selected.total_debit)} · Credit {formatInr(selected.total_credit)}</p>
        <Badge tone={voucherStatusTone(selected.status)}>{selected.status}</Badge>

        {(selected.status === 'posted' || selected.status === 'reversed') && (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Immutable trail — posted vouchers cannot be edited. Corrections require a reversing entry only.</p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Lifecycle</p>
          <ApprovalTimeline steps={voucherTimeline(selected)} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Double-entry lines</p>
          <ul className="space-y-1.5">
            {selected.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-2 rounded-lg bg-ink-50 px-2 py-1.5 font-mono text-xs">
                <span className="text-ink-700">{l.account_code || '—'}{l.cost_centre ? ` · ${l.cost_centre}` : ''}</span>
                <span className="text-ink-900">
                  {l.debit > 0 ? `Dr ${formatInr(l.debit)}` : `Cr ${formatInr(l.credit)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-ink-100 pt-3">
          {canWrite && selected.status === 'draft' && (
            <Button size="sm" loading={validatePending} onClick={onValidate}>Validate</Button>
          )}
          {canApprove && selected.status === 'validated' && (
            <Button size="sm" loading={approvePending} onClick={onApprove}>Approve</Button>
          )}
          {canPost && selected.status === 'approved' && (
            <Button size="sm" loading={postPending} onClick={onPost}>Post</Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
