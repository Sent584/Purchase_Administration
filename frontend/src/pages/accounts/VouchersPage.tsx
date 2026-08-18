import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero, HeroAction } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { accountsApi } from '../../lib/accountsApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { VoucherOut } from '../../types/accounts';
import { formatInr, voucherStatusTone } from './accountsHelpers';
import { VoucherForm } from './VoucherForm';
import { VoucherDetailPanel, voucherWorkflowSteps } from './VoucherDetailPanel';

export function VouchersPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const canWrite = useAuthStore((s) => s.hasPermission('accounts:write'));
  const canApprove = useAuthStore((s) => s.hasPermission('accounts:approve'));
  const canPost = useAuthStore((s) => s.hasPermission('accounts:post'));
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<VoucherOut | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', 'vouchers', institutionId],
    queryFn: () => accountsApi.vouchers(institutionId),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['accounts', 'vouchers'] });
  const validateM = useMutation({ mutationFn: (id: string) => accountsApi.validateVoucher(id), onSuccess: (v) => { refresh(); setSelected(v); }, onError: (e) => setActionError(apiErrorMessage(e)) });
  const approveM = useMutation({ mutationFn: (id: string) => accountsApi.approveVoucher(id), onSuccess: (v) => { refresh(); setSelected(v); }, onError: (e) => setActionError(apiErrorMessage(e)) });
  const postM = useMutation({ mutationFn: (id: string) => accountsApi.postVoucher(id), onSuccess: (v) => { refresh(); setSelected(v); }, onError: (e) => setActionError(apiErrorMessage(e)) });

  const columns: DataTableColumn<VoucherOut>[] = [
    { key: 'num', label: 'Number', render: (v) => <span className="font-mono text-ink-600">{v.voucher_number}</span>, sortAccessor: (v) => v.voucher_number },
    { key: 'type', label: 'Type', render: (v) => <span className="capitalize">{v.voucher_type.replace(/_/g, ' ')}</span> },
    { key: 'narration', label: 'Narration', render: (v) => <span className="truncate text-ink-700">{v.narration || '—'}</span> },
    { key: 'debit', label: 'Debit', render: (v) => formatInr(v.total_debit), align: 'right', sortAccessor: (v) => v.total_debit },
    { key: 'status', label: 'Status', render: (v) => <Badge tone={voucherStatusTone(v.status)}>{v.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHero
        eyebrow="Accounts"
        title="Vouchers"
        subtitle="Double-entry journal workflow from draft through validate, approve and post — posted entries stay immutable."
        actions={
          <>
            <HeroAction to="/accounts">Dashboard</HeroAction>
            {canWrite && (
              <Button onClick={() => { setSelected(null); setShowForm(true); }}>New Voucher</Button>
            )}
          </>
        }
      />
      <div className="mb-5">
        <WorkflowStrip title="GL posting path" steps={voucherWorkflowSteps(selected?.status ?? null)} />
      </div>
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No vouchers" description="Create a balanced voucher to begin the GL workflow." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(v) => v.id}
            onRowClick={(v) => { setShowForm(false); setSelected(v); setActionError(null); }}
            selectedRowId={selected?.id}
            searchPlaceholder="Search vouchers…"
            searchAccessor={(v) => `${v.voucher_number} ${v.narration} ${v.voucher_type}`}
            statusOptions={[
              { value: 'draft', label: 'Draft' },
              { value: 'validated', label: 'Validated' },
              { value: 'approved', label: 'Approved' },
              { value: 'posted', label: 'Posted' },
            ]}
            statusAccessor={(v) => v.status}
          />
        </Card>
      )}

      <Drawer open={showForm} onClose={() => setShowForm(false)} eyebrow="Create voucher" title="New Voucher" subtitle="Draft a balanced journal entry">
        <VoucherForm onClose={() => setShowForm(false)} />
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelected(null)}
        eyebrow="Voucher detail"
        title={selected?.voucher_number ?? 'Voucher'}
        subtitle={selected ? selected.voucher_type.replace(/_/g, ' ') : undefined}
        badge={selected ? <Badge tone={voucherStatusTone(selected.status)}>{selected.status}</Badge> : undefined}
        meta={selected ? [
          { label: 'Debit', value: formatInr(selected.total_debit) },
          { label: 'Credit', value: formatInr(selected.total_credit) },
          { label: 'Status', value: selected.status },
        ] : undefined}
      >
        {selected && (
          <VoucherDetailPanel
            selected={selected}
            actionError={actionError}
            canWrite={canWrite}
            canApprove={canApprove}
            canPost={canPost}
            validatePending={validateM.isPending}
            approvePending={approveM.isPending}
            postPending={postM.isPending}
            onValidate={() => validateM.mutate(selected.id)}
            onApprove={() => approveM.mutate(selected.id)}
            onPost={() => postM.mutate(selected.id)}
          />
        )}
      </Drawer>
    </div>
  );
}
