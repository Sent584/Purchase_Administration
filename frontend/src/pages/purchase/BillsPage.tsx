import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero } from '../../components/erp/PageHero';
import { billApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { PurchaseBillOut } from '../../types/purchase';
import { BillDetail, BillForm, billStatusTone } from './BillPanels';
import { ListCreateBar } from './ListCreateBar';
import { orgScopeColumns, orgScopeSearchText } from './orgScopeColumns';
import { usePurchaseInstitution } from './usePurchaseInstitution';

const columns: DataTableColumn<PurchaseBillOut>[] = [
  { key: 'number', label: 'Bill #', render: (b) => <span className="font-mono text-ink-600">{b.bill_number}</span>, sortAccessor: (b) => b.bill_number },
  ...orgScopeColumns<PurchaseBillOut>(),
  { key: 'vendor', label: 'Vendor', render: (b) => <span className="font-medium text-ink-900">{b.vendor_name}</span>, sortAccessor: (b) => b.vendor_name },
  { key: 'net', label: 'Net Payable', render: (b) => `₹${b.net_payable.toLocaleString('en-IN')}`, align: 'right', sortAccessor: (b) => b.net_payable },
  { key: 'due', label: 'Due Date', render: (b) => new Date(b.payment_due_date).toLocaleDateString('en-IN'), sortAccessor: (b) => b.payment_due_date },
  { key: 'status', label: 'Status', render: (b) => <Badge tone={billStatusTone(b.status)}>{b.status.replace(/_/g, ' ')}</Badge> },
];

export function BillsPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('bill:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase', 'bills', institutionId || 'all'],
    queryFn: () => billApi.list(institutionId || undefined),
  });
  const { data: selected } = useQuery({
    queryKey: ['purchase', 'bill', selectedId],
    queryFn: () => billApi.get(selectedId!),
    enabled: !!selectedId,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['purchase', 'bills'] });
    queryClient.invalidateQueries({ queryKey: ['purchase', 'bill', selectedId] });
  }

  function openCreate() {
    setSelectedId(null);
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHero
        eyebrow="Purchase"
        title="Purchase Bills"
        subtitle="Vendor invoices booked with automatic three-way match, GST and TDS computation."
      />
      <ListCreateBar
        label="Book New Invoice / Bill"
        onCreate={openCreate}
        canCreate={canWrite}
        institutionId={institutionId}
        institutions={institutions}
        needsInstitutionPicker={needsInstitutionPicker}
        onInstitutionChange={setInstitutionId}
      />
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No bills yet"
              description="Book a bill against a completed GRN."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(b) => b.id}
            onRowClick={(b) => { setShowForm(false); setSelectedId(b.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search bill #, campus, vendor…"
            searchAccessor={(b) => `${b.bill_number} ${b.vendor_name} ${b.vendor_invoice_number} ${orgScopeSearchText(b)}`}
            statusOptions={[
              { value: 'booked', label: 'Booked' },
              { value: 'approved', label: 'Approved' },
              { value: 'on_hold', label: 'On Hold' },
            ]}
            statusAccessor={(b) => b.status}
          />
        </Card>
      )}

      <Drawer
        open={showForm && !!institutionId}
        onClose={() => setShowForm(false)}
        eyebrow="Create document"
        title="Book Vendor Bill"
        subtitle="Three-way match against an accepted GRN"
      >
        {institutionId && (
          <BillForm institutionId={institutionId} onClose={() => setShowForm(false)} />
        )}
      </Drawer>

      <Drawer
        open={!!selectedId && !!selected && !showForm}
        onClose={() => setSelectedId(null)}
        eyebrow="Purchase Bill"
        title={selected?.bill_number ?? 'Bill'}
        subtitle={selected?.vendor_name}
        badge={selected ? <Badge tone={billStatusTone(selected.status)}>{selected.status.replace(/_/g, ' ')}</Badge> : undefined}
        meta={
          selected
            ? [
                { label: 'Net payable', value: `₹${selected.net_payable.toLocaleString('en-IN')}` },
                { label: 'Due', value: new Date(selected.payment_due_date).toLocaleDateString('en-IN') },
                { label: 'Invoice', value: selected.vendor_invoice_number || '—' },
              ]
            : undefined
        }
      >
        {selected && <BillDetail bill={selected} onChanged={refresh} />}
      </Drawer>
    </div>
  );
}
