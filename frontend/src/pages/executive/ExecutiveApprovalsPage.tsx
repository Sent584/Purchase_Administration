import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, ErrorBanner, PageSpinner } from '../../components/ui/Feedback';
import { formatInr } from '../../components/erp/FeatureCatalogue';
import { executiveApi } from '../../lib/executiveApi';
import { indentApi, billApi, poApi } from '../../lib/purchaseApi';
import { attendanceApi } from '../../lib/attendanceApi';
import { payrollApi } from '../../lib/payrollApi';
import { accountsApi } from '../../lib/accountsApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import type { ApprovalItem } from '../../types/executive';
import { useState } from 'react';

async function actOnItem(item: ApprovalItem, actorName: string) {
  if (item.domain === 'Purchase Requisition' && item.action === 'approve') {
    return indentApi.approve(item.id, 'Approved from executive desk');
  }
  if (item.domain === 'Purchase Bill' && item.action === 'approve') {
    return billApi.approve(item.id, 'Approved from executive desk');
  }
  if (item.domain === 'Purchase Order' && item.action === 'issue') {
    return poApi.issue(item.id);
  }
  if (item.domain === 'Leave' && item.action === 'approve') {
    return attendanceApi.approveLeave(item.id, actorName);
  }
  if (item.domain === 'Payroll' && item.action === 'approve') {
    return payrollApi.approveRun(item.id);
  }
  if (item.domain === 'Voucher' && item.action === 'approve') {
    return accountsApi.approveVoucher(item.id);
  }
  throw new Error('Open the module to complete this decision');
}

function ApprovalRow({
  item,
  canAct,
  onAct,
  loading,
}: {
  item: ApprovalItem;
  canAct: boolean;
  onAct: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition hover:border-crimson-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">{item.domain}</Badge>
            <Badge tone="neutral">{item.status.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="mt-2 text-base font-semibold text-ink-900">{item.title}</p>
          <p className="text-sm text-ink-500">{item.subtitle}</p>
          <p className="mt-2 text-xs text-ink-400">
            {[item.campus_name, item.division_name, item.department_name].filter(Boolean).join(' · ') || 'Group / institution scope'}
          </p>
        </div>
        <div className="text-right">
          {item.amount != null && item.amount > 0 && (
            <p className="text-lg font-semibold text-crimson-800">{formatInr(item.amount)}</p>
          )}
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Link to={item.href}><Button size="sm" variant="ghost">View</Button></Link>
            {canAct && item.action !== 'award' && (
              <Button size="sm" loading={loading} onClick={onAct}>
                {item.action === 'issue' ? 'Issue PO' : 'Approve'}
              </Button>
            )}
            {item.action === 'award' && (
              <Link to={item.href}><Button size="sm">Review & award</Button></Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExecutiveApprovalsPage() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { institutionId } = usePurchaseInstitution();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['executive', 'approvals', institutionId || 'all'],
    queryFn: () => executiveApi.approvals(institutionId || undefined),
  });

  const mutation = useMutation({
    mutationFn: (item: ApprovalItem) => actOnItem(item, user?.full_name || user?.email || 'Executive'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executive'] });
      setActingId(null);
      setError(null);
    },
    onError: (err) => {
      setActingId(null);
      setError(apiErrorMessage(err, 'Could not complete approval.'));
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <section className="rounded-3xl bg-gradient-to-br from-crimson-900 via-crimson-800 to-crimson-700 px-6 py-8 text-white sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">Decision desk</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Approvals inbox</h1>
        <p className="mt-2 max-w-2xl text-sm text-crimson-100/90">
          All pending PR, PO, bill, leave, payroll and voucher decisions in one place — with campus, division and department context.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">
          {data?.total ?? 0} awaiting action
        </p>
      </section>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.items.length === 0 ? (
        <Card><CardBody><EmptyState title="Inbox clear" description="No pending approvals across modules." /></CardBody></Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <ApprovalRow
              key={`${item.domain}-${item.id}`}
              item={item}
              canAct={hasPermission(item.permission)}
              loading={actingId === item.id && mutation.isPending}
              onAct={() => { setActingId(item.id); mutation.mutate(item); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
