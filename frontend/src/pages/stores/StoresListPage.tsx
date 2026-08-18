import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { storesApi } from '../../lib/storesApi';
import { useAuthStore } from '../../state/authStore';
import type { StoreOut } from '../../types/stores';
import { ListCreateBar } from '../purchase/ListCreateBar';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import { StoreForm } from './StoreForm';

export function StoresListPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('stores:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stores', 'list', institutionId || 'all'],
    queryFn: () => storesApi.list(institutionId || undefined),
  });
  const selected = data?.find((s) => s.id === selectedId) ?? null;

  const columns: DataTableColumn<StoreOut>[] = [
    { key: 'code', label: 'Code', render: (s) => <span className="font-mono text-ink-600">{s.code}</span>, sortAccessor: (s) => s.code },
    { key: 'name', label: 'Name', render: (s) => <span className="font-medium text-ink-900">{s.name}</span>, sortAccessor: (s) => s.name },
    { key: 'type', label: 'Type', render: (s) => <span className="capitalize text-ink-600">{s.store_type.replace(/_/g, ' ')}</span> },
    { key: 'location', label: 'Location', render: (s) => s.location || '—' },
    { key: 'incharge', label: 'In-charge', render: (s) => s.in_charge_name || '—' },
    { key: 'status', label: 'Status', render: (s) => <Badge tone={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Stores</h1>
        <p className="text-sm text-ink-500">Central, department, laboratory, hostel and maintenance stores.</p>
      </div>
      <ListCreateBar
        label="Create New Store"
        hint="Create a store location for campus stock and GRN receipts."
        onCreate={() => { setSelectedId(null); setShowForm(true); }}
        canCreate={canWrite}
        institutionId={institutionId}
        institutions={institutions}
        needsInstitutionPicker={needsInstitutionPicker}
        onInstitutionChange={setInstitutionId}
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No stores yet" description="Create the first store location to begin stocking." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(s) => s.id}
            onRowClick={(s) => { setShowForm(false); setSelectedId(s.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search stores…"
            searchAccessor={(s) => `${s.name} ${s.code} ${s.location} ${s.in_charge_name}`}
          />
        </Card>
      )}

      <Drawer open={showForm && !!institutionId} onClose={() => setShowForm(false)} eyebrow="Create master" title="New Store" subtitle="Register a store for inventory">
        {institutionId && <StoreForm institutionId={institutionId} onClose={() => setShowForm(false)} />}
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelectedId(null)}
        eyebrow="Store"
        title={selected?.name ?? 'Store'}
        subtitle={selected?.code}
        badge={selected ? <Badge tone={selected.status === 'active' ? 'success' : 'neutral'}>{selected.status}</Badge> : undefined}
        meta={selected ? [
          { label: 'Type', value: selected.store_type.replace(/_/g, ' ') },
          { label: 'Location', value: selected.location || '—' },
          { label: 'In-charge', value: selected.in_charge_name || '—' },
        ] : undefined}
      >
        {selected && (
          <div className="space-y-2 text-sm text-ink-700">
            <p className="capitalize">{selected.store_type.replace(/_/g, ' ')} store</p>
            <p>{selected.location || 'No location set'}</p>
            <p>In-charge: {selected.in_charge_name || '—'}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
