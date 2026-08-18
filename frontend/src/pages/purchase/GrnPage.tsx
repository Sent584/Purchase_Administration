import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero } from '../../components/erp/PageHero';
import { DocumentDisclaimer, DocumentFooter, DocumentHeader } from '../../components/documents/DocumentLetterhead';
import { DocumentPrintShell } from '../../components/documents/DocumentPrintShell';
import { grnApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { GrnOut } from '../../types/purchase';
import { CreateGrnForm } from './CreateGrnForm';
import { ListCreateBar } from './ListCreateBar';
import { orgScopeColumns, orgScopeSearchText } from './orgScopeColumns';
import { usePurchaseInstitution } from './usePurchaseInstitution';

function statusTone(status: string) {
  if (status === 'accepted') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  return 'warning' as const;
}

const columns: DataTableColumn<GrnOut>[] = [
  { key: 'number', label: 'GRN #', render: (g) => <span className="font-mono text-ink-600">{g.grn_number}</span>, sortAccessor: (g) => g.grn_number },
  ...orgScopeColumns<GrnOut>(),
  { key: 'po', label: 'PO #', render: (g) => <span className="font-mono text-ink-600">{g.po_number}</span> },
  { key: 'vendor', label: 'Vendor', render: (g) => <span className="font-medium text-ink-900">{g.vendor_name}</span>, sortAccessor: (g) => g.vendor_name },
  { key: 'received', label: 'Received', render: (g) => new Date(g.received_date).toLocaleDateString('en-IN'), sortAccessor: (g) => g.received_date },
  { key: 'quality', label: 'Quality', render: (g) => <Badge tone={statusTone(g.quality_status)}>{g.quality_status}</Badge> },
];

function GrnDetail({ grn }: { grn: GrnOut }) {
  return (
    <DocumentPrintShell documentTitle={`GRN ${grn.grn_number}`} fileName={grn.grn_number}>
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <DocumentHeader
        institutionId={grn.institution_id}
        documentTitle="Goods Receipt Note"
        documentNumber={grn.grn_number}
        documentDate={grn.received_date}
        statusNode={<Badge tone={statusTone(grn.quality_status)}>{grn.quality_status}</Badge>}
      />
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-ink-400">Vendor</p>
          <p className="font-medium text-ink-900">{grn.vendor_name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-400">Against PO</p>
          <p className="font-mono text-ink-800">{grn.po_number}</p>
          <p className="text-xs text-ink-500">Invoice {grn.vendor_invoice_number || '—'}</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-ink-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-400">
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Ordered</th>
              <th className="px-3 py-2">Received</th>
              <th className="px-3 py-2">Accepted</th>
              <th className="px-3 py-2">Rejected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {grn.lines.map((l, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-ink-800">{l.description}</td>
                <td className="px-3 py-2 text-ink-600">{l.ordered_qty} {l.uom}</td>
                <td className="px-3 py-2 text-ink-600">{l.received_qty}</td>
                <td className="px-3 py-2 text-emerald-700">{l.accepted_qty}</td>
                <td className="px-3 py-2 text-red-600">{l.rejected_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grn.remarks && (
        <p className="mt-3 text-sm text-ink-600">
          <span className="font-medium text-ink-800">Remarks:</span> {grn.remarks}
        </p>
      )}
      <DocumentFooter documentType="grn" documentNumber={grn.grn_number} />
      <DocumentDisclaimer />
    </div>
    </DocumentPrintShell>
  );
}

export function GrnPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('grn:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase', 'grns', institutionId || 'all'],
    queryFn: () => grnApi.list(institutionId || undefined),
  });
  const { data: selected } = useQuery({
    queryKey: ['purchase', 'grn', selectedId],
    queryFn: () => grnApi.get(selectedId!),
    enabled: !!selectedId,
  });

  function openCreate() {
    setSelectedId(null);
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHero
        eyebrow="Purchase"
        title="Goods Receipt Notes"
        subtitle="Quality-checked receipt against issued purchase orders — accepted, partial or rejected lines."
      />
      <ListCreateBar
        label="Create New GRN"
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
              title="No GRNs yet"
              description="Record a receipt against an issued PO."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(g) => g.id}
            onRowClick={(g) => { setShowForm(false); setSelectedId(g.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search GRN #, campus, vendor…"
            searchAccessor={(g) => `${g.grn_number} ${g.po_number} ${g.vendor_name} ${orgScopeSearchText(g)}`}
            statusOptions={[
              { value: 'accepted', label: 'Accepted' },
              { value: 'partial', label: 'Partial' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            statusAccessor={(g) => g.quality_status}
          />
        </Card>
      )}

      <Drawer
        open={showForm && !!institutionId}
        onClose={() => setShowForm(false)}
        eyebrow="Create document"
        title="New Goods Receipt"
        subtitle="Receive against an issued purchase order"
      >
        {institutionId && (
          <CreateGrnForm institutionId={institutionId} onClose={() => setShowForm(false)} />
        )}
      </Drawer>

      <Drawer
        open={!!selectedId && !!selected && !showForm}
        onClose={() => setSelectedId(null)}
        eyebrow="Goods Receipt Note"
        title={selected?.grn_number ?? 'GRN'}
        subtitle={selected ? `${selected.vendor_name} · PO ${selected.po_number}` : undefined}
        badge={selected ? <Badge tone={statusTone(selected.quality_status)}>{selected.quality_status}</Badge> : undefined}
        meta={
          selected
            ? [
                { label: 'Received', value: new Date(selected.received_date).toLocaleDateString('en-IN') },
                { label: 'Invoice', value: selected.vendor_invoice_number || '—' },
                { label: 'Lines', value: String(selected.lines.length) },
              ]
            : undefined
        }
      >
        {selected && <GrnDetail grn={selected} />}
      </Drawer>
    </div>
  );
}
