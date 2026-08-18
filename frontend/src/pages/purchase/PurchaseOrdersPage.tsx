import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero } from '../../components/erp/PageHero';
import { poApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { PurchaseOrderOut } from '../../types/purchase';
import { PoDetail, poStatusTone } from './PoDetail';
import { CreatePoForm } from './CreatePoForm';
import { ListCreateBar } from './ListCreateBar';
import { orgScopeColumns, orgScopeSearchText } from './orgScopeColumns';
import { usePurchaseInstitution } from './usePurchaseInstitution';

const columns: DataTableColumn<PurchaseOrderOut>[] = [
  { key: 'number', label: 'PO #', render: (po) => <span className="font-mono text-ink-600">{po.po_number}</span>, sortAccessor: (po) => po.po_number },
  ...orgScopeColumns<PurchaseOrderOut>(),
  { key: 'vendor', label: 'Vendor', render: (po) => <span className="font-medium text-ink-900">{po.vendor_name}</span>, sortAccessor: (po) => po.vendor_name },
  { key: 'method', label: 'Method', render: (po) => <span className="capitalize text-ink-600">{po.procurement_method.replace(/_/g, ' ')}</span> },
  { key: 'total', label: 'Grand Total', render: (po) => `₹${po.grand_total.toLocaleString('en-IN')}`, align: 'right', sortAccessor: (po) => po.grand_total },
  { key: 'status', label: 'Status', render: (po) => <Badge tone={poStatusTone(po.status)}>{po.status}</Badge> },
];

export function PurchaseOrdersPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('po:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase', 'orders', institutionId || 'all'],
    queryFn: () => poApi.list(institutionId || undefined),
  });
  const { data: selected } = useQuery({
    queryKey: ['purchase', 'order', selectedId],
    queryFn: () => poApi.get(selectedId!),
    enabled: !!selectedId,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['purchase', 'order', selectedId] });
  }

  function openCreate() {
    setSelectedId(null);
    setShowCreate(true);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHero
        eyebrow="Purchase"
        title="Purchase Orders"
        subtitle="Branded PO documents with GST breakup, draft → issued lifecycle, and vendor terms."
      />
      <ListCreateBar
        label="Create New Purchase Order"
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
              title="No purchase orders yet"
              description="Create a PO from an awarded RFQ to get started."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(po) => po.id}
            onRowClick={(po) => { setShowCreate(false); setSelectedId(po.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search PO #, vendor, campus…"
            searchAccessor={(po) => `${po.po_number} ${po.vendor_name} ${orgScopeSearchText(po)}`}
            statusOptions={[
              { value: 'draft', label: 'Draft' },
              { value: 'issued', label: 'Issued' },
              { value: 'closed', label: 'Closed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            statusAccessor={(po) => po.status}
          />
        </Card>
      )}

      <Drawer
        open={showCreate && !!institutionId}
        onClose={() => setShowCreate(false)}
        eyebrow="Create document"
        title="New Purchase Order"
        subtitle="Generate PO from an awarded quotation"
      >
        {institutionId && (
          <CreatePoForm institutionId={institutionId} onClose={() => setShowCreate(false)} />
        )}
      </Drawer>

      <Drawer
        open={!!selectedId && !!selected && !showCreate}
        onClose={() => setSelectedId(null)}
        eyebrow="Purchase Order"
        title={selected?.po_number ?? 'Purchase Order'}
        subtitle={selected?.vendor_name}
        badge={selected ? <Badge tone={poStatusTone(selected.status)}>{selected.status}</Badge> : undefined}
        meta={
          selected
            ? [
                { label: 'Grand total', value: `₹${selected.grand_total.toLocaleString('en-IN')}` },
                { label: 'Method', value: selected.procurement_method.replace(/_/g, ' ') },
                { label: 'Lines', value: String(selected.lines.length) },
              ]
            : undefined
        }
      >
        {selected && <PoDetail po={selected} onChanged={refresh} />}
      </Drawer>
    </div>
  );
}
