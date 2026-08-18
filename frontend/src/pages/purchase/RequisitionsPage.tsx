import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { indentApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import type { IndentOut } from '../../types/purchase';
import { formatPrDate, prPriorityTone, prStatusTone } from './requisitionHelpers';
import { RequisitionForm } from './RequisitionForm';
import { RequisitionView } from './RequisitionView';
import { ListCreateBar } from './ListCreateBar';
import { orgScopeColumns, orgScopeSearchText } from './orgScopeColumns';
import { usePurchaseInstitution } from './usePurchaseInstitution';

export function RequisitionsPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('indent:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'closed' | 'create' | 'edit' | 'view'>('closed');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase', 'indents', institutionId || 'all'],
    queryFn: () => indentApi.list(institutionId || undefined),
  });
  const { data: selected } = useQuery({
    queryKey: ['purchase', 'indent', selectedId],
    queryFn: () => indentApi.get(selectedId!),
    enabled: !!selectedId,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['purchase', 'indents'] });
    queryClient.invalidateQueries({ queryKey: ['purchase', 'indent', selectedId] });
  }

  function openCreate() {
    setSelectedId(null);
    setMode('create');
  }

  function openView(row: IndentOut) {
    setSelectedId(row.id);
    setMode('view');
  }

  const columns: DataTableColumn<IndentOut>[] = [
    { key: 'number', label: 'PR No.', render: (r) => <span className="font-mono text-ink-700">{r.indent_number}</span>, sortAccessor: (r) => r.indent_number },
    { key: 'date', label: 'Date', render: (r) => formatPrDate(r.requisition_date ?? r.created_at), sortAccessor: (r) => r.requisition_date ?? r.created_at },
    ...orgScopeColumns<IndentOut>(),
    { key: 'by', label: 'Requested By', render: (r) => r.requested_by_name, sortAccessor: (r) => r.requested_by_name },
    { key: 'priority', label: 'Priority', render: (r) => <Badge tone={prPriorityTone(r.priority)}>{r.priority}</Badge> },
    { key: 'amount', label: 'Est. Amount', render: (r) => `₹${r.total_estimated_amount.toLocaleString('en-IN')}`, align: 'right', sortAccessor: (r) => r.total_estimated_amount },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={prStatusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => openView(r)}>View</Button>
          {canWrite && r.status === 'draft' && (
            <Button size="sm" variant="secondary" onClick={() => { setSelectedId(r.id); setMode('edit'); }}>Edit</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHero
        eyebrow="Purchase"
        title="Purchase Requisitions"
        subtitle="Simple departmental purchase requests — raise, submit, and approve before RFQ / PO processing."
      />
      <ListCreateBar
        label="Create New Requisition"
        onCreate={openCreate}
        canCreate={canWrite}
        institutionId={institutionId}
        institutions={institutions}
        needsInstitutionPicker={needsInstitutionPicker}
        onInstitutionChange={setInstitutionId}
      />
      <div className="mb-5">
        <WorkflowStrip
          title="Requisition workflow"
          steps={[
            { label: 'Draft', description: 'Capture need', status: 'done' },
            { label: 'Submit', description: 'Send for approval', status: 'current' },
            { label: 'HoD', description: 'Dept approval', status: 'upcoming' },
            { label: 'Principal / Finance', description: 'Final clearance', status: 'upcoming' },
            { label: 'Ready for RFQ', description: 'Hand off to purchase', status: 'upcoming' },
          ]}
        />
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No purchase requisitions yet"
              description="Create the first PR to initiate procurement."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(r) => r.id}
            onRowClick={openView}
            selectedRowId={selectedId}
            searchPlaceholder="Search PR no., campus, division, department…"
            searchAccessor={(r) => `${r.indent_number} ${r.requested_by_name} ${r.budget_head} ${orgScopeSearchText(r)}`}
            statusOptions={[
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            statusAccessor={(r) => r.status}
          />
        </Card>
      )}

      <Drawer
        open={mode === 'create' && !!institutionId}
        onClose={() => setMode('closed')}
        eyebrow="Create document"
        title="New Purchase Requisition"
        subtitle="Capture essentials to initiate purchase"
      >
        {institutionId && (
          <RequisitionForm institutionId={institutionId} onClose={() => setMode('closed')} />
        )}
      </Drawer>

      <Drawer
        open={mode === 'edit' && !!selected && !!institutionId}
        onClose={() => setMode('closed')}
        eyebrow="Edit draft"
        title={selected?.indent_number ?? 'Edit PR'}
        subtitle={selected?.department_name}
      >
        {institutionId && selected && (
          <RequisitionForm institutionId={institutionId} editing={selected} onClose={() => { refresh(); setMode('view'); }} />
        )}
      </Drawer>

      <Drawer
        open={mode === 'view' && !!selected}
        onClose={() => { setMode('closed'); setSelectedId(null); }}
        eyebrow="Purchase Requisition"
        title={selected?.indent_number ?? 'PR'}
        subtitle={selected ? `${selected.department_name || 'Department'} · ${selected.requested_by_name}` : undefined}
        badge={selected ? <Badge tone={prStatusTone(selected.status)}>{selected.status}</Badge> : undefined}
        meta={
          selected
            ? [
                { label: 'Est. amount', value: `₹${selected.total_estimated_amount.toLocaleString('en-IN')}` },
                { label: 'Priority', value: selected.priority },
                { label: 'Required by', value: formatPrDate(selected.required_by_date) },
              ]
            : undefined
        }
      >
        {selected && (
          <RequisitionView
            pr={selected}
            onChanged={refresh}
            onEdit={() => setMode('edit')}
          />
        )}
      </Drawer>
    </div>
  );
}
