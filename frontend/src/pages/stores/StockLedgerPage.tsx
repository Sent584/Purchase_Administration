import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { stockApi, storesApi } from '../../lib/storesApi';
import { orgApi } from '../../lib/orgApi';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import { orgScopeColumns, orgScopeSearchText } from '../purchase/orgScopeColumns';
import type { StockBalanceOut } from '../../types/stores';
import type { OrgScopeFields } from '../../types/purchase';

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

type BalanceRow = StockBalanceOut & OrgScopeFields;

export function StockLedgerPage() {
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [storeId, setStoreId] = useState('');
  const [campusId, setCampusId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const storesQ = useQuery({
    queryKey: ['stores', 'list', institutionId],
    queryFn: () => storesApi.list(institutionId || undefined),
    enabled: !!institutionId,
  });
  const campusesQ = useQuery({
    queryKey: ['org', 'campuses', institutionId],
    queryFn: () => orgApi.listCampuses(institutionId),
    enabled: !!institutionId,
  });
  const unitsQ = useQuery({
    queryKey: ['org', 'units', campusId],
    queryFn: () => orgApi.listOrgUnits(campusId),
    enabled: !!campusId,
  });
  const stockQ = useQuery({
    queryKey: ['stores', 'stock', institutionId, storeId, campusId, divisionId, departmentId],
    queryFn: () =>
      stockApi.balances({
        institutionId: institutionId || undefined,
        storeId: storeId || undefined,
        campusId: campusId || undefined,
        divisionId: divisionId || undefined,
        departmentId: departmentId || undefined,
      }),
  });

  const rows = useMemo(() => (stockQ.data ?? []) as BalanceRow[], [stockQ.data]);

  const columns: DataTableColumn<BalanceRow>[] = [
    { key: 'code', label: 'Item', render: (b) => (
      <div>
        <p className="font-medium text-ink-900">{b.item_name}</p>
        <p className="font-mono text-xs text-ink-400">{b.item_code}</p>
      </div>
    ), sortAccessor: (b) => b.item_name },
    ...orgScopeColumns<BalanceRow>(),
    { key: 'store', label: 'Store', render: (b) => b.store_name, sortAccessor: (b) => b.store_name },
    { key: 'qty', label: 'Qty', render: (b) => (
      <span className="flex items-center justify-end gap-2">
        {b.quantity} {b.uom}
        {b.reorder_level > 0 && b.quantity <= b.reorder_level && <Badge tone="warning">Below reorder</Badge>}
      </span>
    ), align: 'right', sortAccessor: (b) => b.quantity },
    { key: 'rate', label: 'Last Rate', render: (b) => formatInr(b.last_rate), align: 'right', sortAccessor: (b) => b.last_rate },
    { key: 'val', label: 'Valuation', render: (b) => formatInr(b.valuation), align: 'right', sortAccessor: (b) => b.valuation },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Stock Ledger</h1>
        <p className="text-sm text-ink-500">On-hand balances by campus, division and department — updated from GRN receipts.</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-ink-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        {needsInstitutionPicker && (
          <Select label="Institution" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
            <option value="">Select institution</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </Select>
        )}
        <Select label="Campus" value={campusId} onChange={(e) => { setCampusId(e.target.value); setDivisionId(''); setDepartmentId(''); }}>
          <option value="">All campuses</option>
          {campusesQ.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Division" value={divisionId} disabled={!campusId} onChange={(e) => { setDivisionId(e.target.value); setDepartmentId(''); }}>
          <option value="">All divisions</option>
          {unitsQ.data?.filter((u) => u.unit_type === 'division').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select label="Department" value={departmentId} disabled={!campusId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {unitsQ.data
            ?.filter((u) => u.unit_type === 'department' || u.unit_type === 'office' || u.unit_type === 'store' || u.unit_type === 'laboratory')
            .filter((u) => !divisionId || u.parent_id === divisionId)
            .map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select label="Store" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">All stores</option>
          {storesQ.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {stockQ.isLoading ? (
        <PageSpinner />
      ) : rows.length === 0 ? (
        <Card><CardBody><EmptyState title="No stock balances" description="Receive a GRN with accepted quantity to populate campus / division / department stock." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={rows}
            columns={columns}
            getRowId={(b) => `${b.store_id}-${b.item_id}-${b.campus_id ?? ''}-${b.department_id ?? ''}`}
            searchPlaceholder="Search item, store, campus…"
            searchAccessor={(b) => `${b.item_name} ${b.item_code} ${b.store_name} ${orgScopeSearchText(b)}`}
            statusOptions={[
              { value: 'ok', label: 'Healthy' },
              { value: 'low', label: 'Below reorder' },
            ]}
            statusAccessor={(b) => (b.reorder_level > 0 && b.quantity <= b.reorder_level ? 'low' : 'ok')}
          />
        </Card>
      )}
    </div>
  );
}
