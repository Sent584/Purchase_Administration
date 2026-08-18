import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { stockApi } from '../../lib/storesApi';
import { useAuthStore } from '../../state/authStore';
import type { StockTxnOut } from '../../types/stores';
import { ListCreateBar } from '../purchase/ListCreateBar';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import { orgScopeColumns, orgScopeSearchText } from '../purchase/orgScopeColumns';
import { StockIssueForm } from './StockIssueForm';
import type { OrgScopeFields } from '../../types/purchase';

function txnTone(type: string) {
  if (type === 'issue') return 'warning' as const;
  if (type === 'issue_return' || type === 'grn_receipt' || type === 'opening') return 'success' as const;
  if (type === 'write_off') return 'danger' as const;
  return 'neutral' as const;
}

type TxnRow = StockTxnOut & OrgScopeFields;

export function StockIssuesPage() {
  const canIssue = useAuthStore((s) => s.hasPermission('stores:issue'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stores', 'txns', institutionId || 'all'],
    queryFn: () => stockApi.transactions({ institutionId: institutionId || undefined }),
  });
  const selected = data?.find((t) => t.id === selectedId) ?? null;

  const columns: DataTableColumn<TxnRow>[] = [
    { key: 'number', label: 'Txn #', render: (t) => <span className="font-mono text-ink-600">{t.txn_number}</span>, sortAccessor: (t) => t.txn_number },
    { key: 'type', label: 'Type', render: (t) => <Badge tone={txnTone(t.txn_type)}>{t.txn_type.replace(/_/g, ' ')}</Badge> },
    ...orgScopeColumns<TxnRow>(),
    { key: 'item', label: 'Item', render: (t) => (
      <div>
        <p className="font-medium text-ink-900">{t.item_name}</p>
        <p className="text-xs text-ink-400">{t.store_name}</p>
      </div>
    ), sortAccessor: (t) => t.item_name },
    { key: 'qty', label: 'Qty', render: (t) => `${t.quantity} ${t.uom}`, align: 'right', sortAccessor: (t) => t.quantity },
    { key: 'to', label: 'Issued to', render: (t) => t.issued_to || '—' },
    { key: 'status', label: 'Status', render: (t) => <Badge tone={t.status === 'approved' ? 'success' : 'neutral'}>{t.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Stock Issues &amp; Movements</h1>
        <p className="text-sm text-ink-500">Issue stock by campus / division / department and review ledger movements.</p>
      </div>
      <ListCreateBar
        label="Create New Issue"
        hint="Issue stock against a campus, division and department."
        onCreate={() => { setSelectedId(null); setShowForm(true); }}
        canCreate={canIssue}
        institutionId={institutionId}
        institutions={institutions}
        needsInstitutionPicker={needsInstitutionPicker}
        onInstitutionChange={setInstitutionId}
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No transactions yet" description="Receive a GRN or post an issue to get started." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data as TxnRow[]}
            columns={columns}
            getRowId={(t) => t.id}
            onRowClick={(t) => { setShowForm(false); setSelectedId(t.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search transactions…"
            searchAccessor={(t) => `${t.txn_number} ${t.item_name} ${t.store_name} ${t.issued_to} ${orgScopeSearchText(t)}`}
            statusOptions={[
              { value: 'issue', label: 'Issue' },
              { value: 'opening', label: 'Opening' },
              { value: 'grn_receipt', label: 'GRN receipt' },
              { value: 'transfer_out', label: 'Transfer out' },
              { value: 'adjustment', label: 'Adjustment' },
            ]}
            statusAccessor={(t) => t.txn_type}
          />
        </Card>
      )}

      <Drawer open={showForm && !!institutionId} onClose={() => setShowForm(false)} eyebrow="Stock movement" title="New Stock Issue" subtitle="Issue from store to department">
        {institutionId && <StockIssueForm institutionId={institutionId} onClose={() => setShowForm(false)} />}
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelectedId(null)}
        eyebrow="Stock transaction"
        title={selected?.txn_number ?? 'Transaction'}
        subtitle={selected?.item_name}
        badge={selected ? <Badge tone={txnTone(selected.txn_type)}>{selected.txn_type.replace(/_/g, ' ')}</Badge> : undefined}
        meta={selected ? [
          { label: 'Qty', value: `${selected.quantity} ${selected.uom}` },
          { label: 'Campus', value: selected.campus_name || '—' },
          { label: 'Department', value: selected.department_name || '—' },
        ] : undefined}
      >
        {selected && (
          <dl className="divide-y divide-ink-100 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-ink-500">Store</dt><dd>{selected.store_name}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-ink-500">Division</dt><dd>{selected.division_name || '—'}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-ink-500">Issued to</dt><dd>{selected.issued_to || '—'}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-ink-500">Reference</dt><dd>{selected.reference_type || '—'} {selected.reference_id}</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-ink-500">Remarks</dt><dd className="text-right">{selected.remarks || '—'}</dd></div>
          </dl>
        )}
      </Drawer>
    </div>
  );
}
