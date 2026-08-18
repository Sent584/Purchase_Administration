import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { catalogApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { ItemOut } from '../../types/purchase';
import { ListCreateBar } from './ListCreateBar';
import { usePurchaseInstitution } from './usePurchaseInstitution';
import { CatalogItemForm, categories } from './CatalogItemForm';
import { CatalogItemDetail } from './CatalogItemDetail';

export function CatalogPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('catalog:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase', 'catalog', institutionId || 'all'],
    queryFn: () => catalogApi.list(institutionId || undefined),
  });
  const selected = data?.find((i) => i.id === selectedId) ?? null;

  function openCreate() {
    setSelectedId(null);
    setShowForm(true);
  }

  const columns: DataTableColumn<ItemOut>[] = [
    { key: 'code', label: 'Code', render: (i) => <span className="font-mono text-ink-600">{i.code}</span>, sortAccessor: (i) => i.code },
    { key: 'name', label: 'Name', render: (i) => <span className="font-medium text-ink-900">{i.name}{i.is_capital_item && <span className="ml-2"><Badge tone="gold">Capital</Badge></span>}</span>, sortAccessor: (i) => i.name },
    { key: 'category', label: 'Category', render: (i) => <span className="capitalize text-ink-600">{i.category.replace(/_/g, ' ')}</span> },
    { key: 'manufacturer', label: 'Manufacturer', render: (i) => i.manufacturer || '—' },
    { key: 'hsn', label: 'HSN', render: (i) => <span className="font-mono text-ink-600">{i.hsn_code || '—'}</span> },
    { key: 'gst', label: 'GST %', render: (i) => `${i.gst_rate}%`, align: 'right' },
    { key: 'rate', label: 'Standard Rate', render: (i) => `₹${i.standard_rate.toLocaleString('en-IN')}`, align: 'right', sortAccessor: (i) => i.standard_rate },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Item Catalog</h1>
        <p className="text-sm text-ink-500">Item master with HSN codes, GST rates, manufacturer details and preferred vendors.</p>
      </div>
      <ListCreateBar
        label="Create New Catalog Item"
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
        <Card><CardBody><EmptyState title="No items yet" description="Create the first catalog item to get started." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(i) => i.id}
            onRowClick={(i) => { setShowForm(false); setSelectedId(i.id); }}
            selectedRowId={selectedId}
            searchPlaceholder="Search by name, code, manufacturer…"
            searchAccessor={(i) => `${i.name} ${i.code} ${i.manufacturer} ${i.hsn_code}`}
            statusOptions={categories.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
            statusAccessor={(i) => i.category}
          />
        </Card>
      )}

      <Drawer
        open={showForm && !!institutionId}
        onClose={() => setShowForm(false)}
        eyebrow="Create master"
        title="New Catalog Item"
        subtitle="Add item to the purchase catalog"
      >
        {institutionId && <CatalogItemForm institutionId={institutionId} onClose={() => setShowForm(false)} />}
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelectedId(null)}
        eyebrow="Catalog item"
        title={selected?.name ?? 'Item'}
        subtitle={selected ? selected.category.replace(/_/g, ' ') : undefined}
        badge={selected?.is_capital_item ? <Badge tone="gold">Capital</Badge> : undefined}
        meta={selected ? [
          { label: 'Code', value: selected.code },
          { label: 'HSN', value: selected.hsn_code || '—' },
          { label: 'Rate', value: `₹${selected.standard_rate.toLocaleString('en-IN')}` },
        ] : undefined}
      >
        {selected && <CatalogItemDetail item={selected} />}
      </Drawer>
    </div>
  );
}
