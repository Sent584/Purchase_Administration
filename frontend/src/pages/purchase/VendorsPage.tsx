import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { vendorApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { VendorOut } from '../../types/purchase';
import { ListCreateBar } from './ListCreateBar';
import { usePurchaseInstitution } from './usePurchaseInstitution';
import { VendorForm } from './VendorForm';
import { VendorDetail, vendorStatusTone } from './VendorDetail';

export function VendorsPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('vendor:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase', 'vendors', institutionId || 'all'],
    queryFn: () => vendorApi.list(institutionId || undefined),
  });
  const selected = data?.find((v) => v.id === selectedId) ?? null;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['purchase', 'vendors'] });
    queryClient.invalidateQueries({ queryKey: ['purchase', 'vendor-stats'] });
  }

  function openCreate() {
    setSelectedId(null);
    setShowForm(true);
  }

  const columns: DataTableColumn<VendorOut>[] = [
    { key: 'code', label: 'Code', render: (v) => <span className="font-mono text-ink-600">{v.code}</span>, sortAccessor: (v) => v.code },
    { key: 'trade_name', label: 'Trade Name', render: (v) => <span className="font-medium text-ink-900">{v.trade_name}</span>, sortAccessor: (v) => v.trade_name },
    { key: 'category', label: 'Category', render: (v) => <span className="capitalize text-ink-600">{v.vendor_category.replace(/_/g, ' ')}</span> },
    { key: 'gstin', label: 'GSTIN', render: (v) => <span className="font-mono text-xs text-ink-600">{v.gstin || '—'}</span> },
    { key: 'rating', label: 'Rating', render: (v) => v.rating.overall ? <span className="inline-flex items-center gap-1 text-ink-700"><Icon name="star" className="h-3.5 w-3.5 text-gold-500" />{v.rating.overall}</span> : '—', sortAccessor: (v) => v.rating.overall, align: 'center' },
    { key: 'msme', label: 'MSME', render: (v) => (v.msme_registered ? <Badge tone="gold">MSME</Badge> : '—'), align: 'center' },
    { key: 'status', label: 'Status', render: (v) => <Badge tone={vendorStatusTone(v.status)}>{v.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Vendors</h1>
        <p className="text-sm text-ink-500">Vendor master, GST/TDS profile, commercial terms, ratings and performance history.</p>
      </div>
      <ListCreateBar
        label="Create New Vendor"
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
        <Card><CardBody><EmptyState title="No vendors yet" description="Create the first vendor to get started." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(v) => v.id}
            onRowClick={(v) => { setShowForm(false); setSelectedId(v.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search by name, code, GSTIN…"
            searchAccessor={(v) => `${v.trade_name} ${v.code} ${v.gstin} ${v.legal_name}`}
            statusOptions={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'blacklisted', label: 'Blacklisted' }]}
            statusAccessor={(v) => v.status}
          />
        </Card>
      )}

      <Drawer
        open={showForm && !!institutionId}
        onClose={() => setShowForm(false)}
        eyebrow="Create master"
        title="New Vendor"
        subtitle="Register vendor for procurement"
      >
        {institutionId && <VendorForm institutionId={institutionId} onClose={() => setShowForm(false)} />}
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelectedId(null)}
        eyebrow="Vendor profile"
        title={selected?.trade_name ?? 'Vendor'}
        subtitle={selected?.legal_name}
        badge={selected ? <Badge tone={vendorStatusTone(selected.status)}>{selected.status}</Badge> : undefined}
        meta={selected ? [
          { label: 'Code', value: selected.code },
          { label: 'GSTIN', value: selected.gstin || '—' },
          { label: 'Category', value: selected.vendor_category.replace(/_/g, ' ') },
        ] : undefined}
      >
        {selected && <VendorDetail vendor={selected} canWrite={canWrite} onSaved={refresh} />}
      </Drawer>
    </div>
  );
}
