import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { quotationApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { QuotationOut } from '../../types/purchase';
import { CreateRfqForm } from './CreateRfqForm';
import { QuotationDetail, quotationStatusTone } from './QuotationDetail';
import { ListCreateBar } from './ListCreateBar';
import { orgScopeColumns, orgScopeSearchText } from './orgScopeColumns';
import { usePurchaseInstitution } from './usePurchaseInstitution';

const quotationColumns: DataTableColumn<QuotationOut>[] = [
  { key: 'number', label: 'RFQ #', render: (q) => <span className="font-mono text-ink-600">{q.rfq_number}</span>, sortAccessor: (q) => q.rfq_number },
  ...orgScopeColumns<QuotationOut>(),
  { key: 'method', label: 'Method', render: (q) => <span className="capitalize text-ink-600">{q.procurement_method.replace(/_/g, ' ')}</span> },
  { key: 'vendors', label: 'Vendors', render: (q) => q.vendor_ids.length, align: 'center' },
  { key: 'quotes', label: 'Quotes', render: (q) => `${q.quotes.length} / ${q.vendor_ids.length}`, align: 'center' },
  { key: 'status', label: 'Status', render: (q) => <Badge tone={quotationStatusTone(q.status)}>{q.status.replace(/_/g, ' ')}</Badge> },
];

export function QuotationsPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('quotation:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase', 'quotations', institutionId || 'all'],
    queryFn: () => quotationApi.list(institutionId || undefined),
  });
  const { data: selected } = useQuery({
    queryKey: ['purchase', 'quotation', selectedId],
    queryFn: () => quotationApi.get(selectedId!),
    enabled: !!selectedId,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['purchase', 'quotations'] });
    queryClient.invalidateQueries({ queryKey: ['purchase', 'quotation', selectedId] });
  }

  function openCreate() {
    setSelectedId(null);
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHero
        eyebrow="Purchase"
        title="Quotations & Comparative"
        subtitle="RFQs, vendor quotes, auto-ranked comparative statements and L1-first award decisions."
      />
      <ListCreateBar
        label="Create New Quotation"
        onCreate={openCreate}
        canCreate={canWrite}
        institutionId={institutionId}
        institutions={institutions}
        needsInstitutionPicker={needsInstitutionPicker}
        onInstitutionChange={setInstitutionId}
      />
      <div className="mb-5">
        <WorkflowStrip
          title="RFQ → L1 → Award"
          steps={[
            { label: 'RFQ sent', description: 'Invite ≥3 vendors', status: 'done' },
            { label: 'Quotes in', description: 'Record offers', status: 'current' },
            { label: 'Comparative', description: 'Rank landed cost', status: 'upcoming' },
            { label: 'L1 award', description: 'Justify if non-L1', status: 'upcoming' },
            { label: 'Generate PO', description: 'Issue order', status: 'upcoming' },
          ]}
        />
      </div>
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No RFQs yet"
              description="Create a quotation (RFQ) from an approved purchase requisition."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={quotationColumns}
            getRowId={(q) => q.id}
            onRowClick={(q) => { setShowForm(false); setSelectedId(q.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search RFQ #, campus, division…"
            searchAccessor={(q) => `${q.rfq_number} ${orgScopeSearchText(q)}`}
            statusOptions={[
              { value: 'rfq_sent', label: 'RFQ Sent' },
              { value: 'quotes_received', label: 'Quotes Received' },
              { value: 'awarded', label: 'Awarded' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            statusAccessor={(q) => q.status}
          />
        </Card>
      )}

      <Drawer
        open={showForm && !!institutionId}
        onClose={() => setShowForm(false)}
        eyebrow="Create document"
        title="New Quotation / RFQ"
        subtitle="Invite vendors against an approved purchase requisition"
      >
        {institutionId && (
          <CreateRfqForm institutionId={institutionId} onClose={() => setShowForm(false)} />
        )}
      </Drawer>

      <Drawer
        open={!!selectedId && !!selected && !showForm}
        onClose={() => setSelectedId(null)}
        eyebrow="Quotation / RFQ"
        title={selected?.rfq_number ?? 'RFQ'}
        subtitle={selected ? `${selected.division_name || selected.department_name || '—'} · ${selected.vendor_ids.length} vendors` : undefined}
        badge={
          selected ? (
            <Badge tone={quotationStatusTone(selected.status)}>{selected.status.replace(/_/g, ' ')}</Badge>
          ) : undefined
        }
        meta={
          selected
            ? [
                { label: 'Campus', value: selected.campus_name || '—' },
                { label: 'Division', value: selected.division_name || '—' },
                { label: 'Department', value: selected.department_name || '—' },
              ]
            : undefined
        }
      >
        {selected && <QuotationDetail quotation={selected} onChanged={refresh} />}
      </Drawer>
    </div>
  );
}
