import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { assetsApi } from '../../lib/assetsApi';
import { useAuthStore } from '../../state/authStore';
import { useOrgScopeOptions } from '../../shared/org/useOrgScopeOptions';
import type { AssetOut } from '../../types/assets';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import { AssetCreateForm } from './AssetCreateForm';
import { AssetDetailDrawer } from './AssetDetailDrawer';
import { AssetOrgFilters } from './AssetOrgFilters';
import { ASSET_CLASS_OPTIONS, assetStatusTone, classLabel, formatInr } from './assetHelpers';

export function AssetRegisterPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('assets:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<AssetOut | null>(null);
  const [campusId, setCampusId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assetClass, setAssetClass] = useState('');
  const { campuses, divisions, departments } = useOrgScopeOptions(institutionId, campusId, divisionId);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', 'list', institutionId, campusId, divisionId, departmentId, assetClass],
    queryFn: () =>
      assetsApi.list({
        institution_id: institutionId || undefined,
        campus_id: campusId || undefined,
        division_id: divisionId || undefined,
        department_id: departmentId || undefined,
        asset_class: assetClass || undefined,
      }),
    enabled: Boolean(institutionId) || !needsInstitutionPicker,
  });

  const columns: DataTableColumn<AssetOut>[] = [
    { key: 'code', label: 'Code', render: (a) => <span className="font-mono text-ink-600">{a.asset_code}</span>, sortAccessor: (a) => a.asset_code },
    { key: 'name', label: 'Name', render: (a) => <span className="font-medium text-ink-900">{a.name}</span>, sortAccessor: (a) => a.name },
    { key: 'class', label: 'Class', render: (a) => classLabel(a.asset_class) },
    { key: 'campus', label: 'Campus', render: (a) => a.campus_name || '—' },
    { key: 'division', label: 'Division', render: (a) => a.division_name || '—' },
    { key: 'dept', label: 'Department', render: (a) => a.department_name || '—' },
    { key: 'value', label: 'Book Value', render: (a) => formatInr(a.current_book_value), sortAccessor: (a) => a.current_book_value, align: 'right' },
    { key: 'status', label: 'Status', render: (a) => <Badge tone={assetStatusTone(a.status)}>{a.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Asset Register</h1>
          <p className="text-sm text-ink-500">Fixed assets by campus, division and department.</p>
        </div>
        {canWrite && (
          <Button disabled={!institutionId} onClick={() => { setSelected(null); setShowForm(true); }}>
            Register Asset
          </Button>
        )}
      </div>

      <AssetOrgFilters
        needsInstitutionPicker={needsInstitutionPicker}
        institutions={institutions}
        institutionId={institutionId}
        onInstitution={(id) => { setInstitutionId(id); setCampusId(''); setDivisionId(''); setDepartmentId(''); }}
        campuses={campuses}
        divisions={divisions}
        departments={departments}
        campusId={campusId}
        divisionId={divisionId}
        departmentId={departmentId}
        assetClass={assetClass}
        onCampus={(id) => { setCampusId(id); setDivisionId(''); setDepartmentId(''); }}
        onDivision={(id) => { setDivisionId(id); setDepartmentId(''); }}
        onDepartment={setDepartmentId}
        onAssetClass={setAssetClass}
        classOptions={ASSET_CLASS_OPTIONS}
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No assets yet" description="Register an asset against campus, division and department." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(a) => a.id}
            onRowClick={(a) => { setShowForm(false); setSelected(a); }}
            selectedRowId={selected?.id}
            searchPlaceholder="Search by name, code, department…"
            searchAccessor={(a) => `${a.name} ${a.asset_code} ${a.campus_name} ${a.division_name} ${a.department_name} ${a.custodian_name}`}
            statusOptions={[
              { value: 'active', label: 'Active' },
              { value: 'under_repair', label: 'Under repair' },
              { value: 'disposed', label: 'Disposed' },
            ]}
            statusAccessor={(a) => a.status}
          />
        </Card>
      )}

      <Drawer open={showForm} onClose={() => setShowForm(false)} eyebrow="Asset master" title="Register Asset" subtitle="Assign campus, division and department">
        {institutionId && <AssetCreateForm institutionId={institutionId} onClose={() => setShowForm(false)} />}
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelected(null)}
        eyebrow="Asset profile"
        title={selected?.name ?? 'Asset'}
        subtitle={selected?.asset_code}
        badge={selected ? <Badge tone={assetStatusTone(selected.status)}>{selected.status}</Badge> : undefined}
        meta={selected ? [
          { label: 'Campus', value: selected.campus_name || '—' },
          { label: 'Department', value: selected.department_name || '—' },
          { label: 'Book value', value: formatInr(selected.current_book_value) },
        ] : undefined}
      >
        <AssetDetailDrawer asset={selected} onClose={() => setSelected(null)} />
      </Drawer>
    </div>
  );
}
