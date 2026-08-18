import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { attendanceApi } from '../../lib/attendanceApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { LeaveApplicationOut } from '../../types/attendance';
import { formatDate, leaveStatusTone } from './attendanceHelpers';
import { LeaveForm } from './LeaveForm';
import { LeaveDetailPanel, LeaveFeatureNotes, leaveWorkflowSteps } from './LeaveAppPanels';

export function LeaveApplicationsPage() {
  const user = useAuthStore((s) => s.user);
  const institutionId = user?.institution_id ?? undefined;
  const canWrite = useAuthStore((s) => s.hasPermission('leave:write'));
  const canApprove = useAuthStore((s) => s.hasPermission('leave:approve'));
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<LeaveApplicationOut | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'leave-apps', institutionId],
    queryFn: () => attendanceApi.leaveApplications(institutionId),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['attendance', 'leave-apps'] });
  const approveM = useMutation({
    mutationFn: (id: string) => attendanceApi.approveLeave(id, user?.full_name ?? 'Approver'),
    onSuccess: () => { refresh(); setSelected(null); },
    onError: (err) => setActionError(apiErrorMessage(err)),
  });
  const rejectM = useMutation({
    mutationFn: (id: string) => attendanceApi.rejectLeave(id, user?.full_name ?? 'Approver'),
    onSuccess: () => { refresh(); setSelected(null); },
    onError: (err) => setActionError(apiErrorMessage(err)),
  });

  const columns: DataTableColumn<LeaveApplicationOut>[] = [
    { key: 'type', label: 'Type', render: (a) => <span className="font-mono text-ink-600">{a.leave_type_code}</span> },
    { key: 'from', label: 'From', render: (a) => formatDate(a.from_date), sortAccessor: (a) => a.from_date },
    { key: 'to', label: 'To', render: (a) => formatDate(a.to_date) },
    { key: 'days', label: 'Days', render: (a) => String(a.days), align: 'right' },
    { key: 'reason', label: 'Reason', render: (a) => <span className="truncate text-ink-700">{a.reason || '—'}</span> },
    { key: 'status', label: 'Status', render: (a) => <Badge tone={leaveStatusTone(a.status)}>{a.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHero
        eyebrow="Attendance"
        title="Leave Applications"
        subtitle="Draft → submit → manager → HR → joining report, with substitute and clubbing policy checks."
        actions={canWrite ? <Button onClick={() => { setSelected(null); setShowForm(true); }}>Apply Leave</Button> : undefined}
      />
      <WorkflowStrip title="Leave approval path" steps={leaveWorkflowSteps(selected?.status ?? null)} />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No leave applications" description="Applications appear after staff submit leave." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(a) => a.id}
            onRowClick={(a) => { setShowForm(false); setSelected(a); setActionError(null); }}
            selectedRowId={selected?.id}
            searchPlaceholder="Search leave…"
            searchAccessor={(a) => `${a.leave_type_code} ${a.reason} ${a.employee_id}`}
            statusOptions={[
              { value: 'submitted', label: 'Submitted' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'draft', label: 'Draft' },
            ]}
            statusAccessor={(a) => a.status}
          />
        </Card>
      )}
      <LeaveFeatureNotes />

      <Drawer open={showForm} onClose={() => setShowForm(false)} eyebrow="Apply leave" title="New Leave Application" subtitle="Submit leave with dates and reason">
        <LeaveForm onClose={() => setShowForm(false)} />
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelected(null)}
        eyebrow="Leave application"
        title={selected?.leave_type_code ?? 'Leave'}
        subtitle={selected ? `${formatDate(selected.from_date)} → ${formatDate(selected.to_date)}` : undefined}
        badge={selected ? <Badge tone={leaveStatusTone(selected.status)}>{selected.status}</Badge> : undefined}
        meta={selected ? [
          { label: 'Days', value: String(selected.days) },
          { label: 'Status', value: selected.status },
        ] : undefined}
      >
        {selected && (
          <LeaveDetailPanel
            selected={selected}
            actionError={actionError}
            canApprove={canApprove}
            approvePending={approveM.isPending}
            rejectPending={rejectM.isPending}
            onApprove={() => approveM.mutate(selected.id)}
            onReject={() => rejectM.mutate(selected.id)}
          />
        )}
      </Drawer>
    </div>
  );
}
