import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero, HeroAction } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { payrollApi } from '../../lib/payrollApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { PayrollRunOut } from '../../types/payroll';
import { formatInr, monthName, runStatusTone } from './payrollHelpers';
import { PayrollCreateRunForm } from './PayrollCreateRunForm';
import { PayrollActionChecklist, StatutorySummaryCards, payrollWorkflowSteps } from './PayrollRunPanels';

export function PayrollRunsPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const canWrite = useAuthStore((s) => s.hasPermission('payroll:write'));
  const canApprove = useAuthStore((s) => s.hasPermission('payroll:approve'));
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PayrollRunOut | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', 'runs', institutionId],
    queryFn: () => payrollApi.listRuns(institutionId),
  });

  const activeRun = selected ?? data?.[0] ?? null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
    queryClient.invalidateQueries({ queryKey: ['payroll', 'dashboard'] });
  };

  const processM = useMutation({
    mutationFn: (id: string) => payrollApi.processRun(id),
    onSuccess: (run) => { refresh(); setSelected(run); },
    onError: (err) => setActionError(apiErrorMessage(err)),
  });
  const approveM = useMutation({
    mutationFn: (id: string) => payrollApi.approveRun(id),
    onSuccess: (run) => { refresh(); setSelected(run); },
    onError: (err) => setActionError(apiErrorMessage(err)),
  });
  const lockM = useMutation({
    mutationFn: (id: string) => payrollApi.lockRun(id),
    onSuccess: (run) => { refresh(); setSelected(run); },
    onError: (err) => setActionError(apiErrorMessage(err)),
  });

  const columns: DataTableColumn<PayrollRunOut>[] = [
    {
      key: 'period',
      label: 'Period',
      render: (r) => <span className="font-medium text-ink-900">{monthName(r.period_month)} {r.period_year}</span>,
      sortAccessor: (r) => r.period_year * 100 + r.period_month,
    },
    { key: 'emps', label: 'Employees', render: (r) => String(r.employee_count), align: 'right' },
    { key: 'gross', label: 'Gross', render: (r) => formatInr(r.gross_total), align: 'right', sortAccessor: (r) => r.gross_total },
    { key: 'net', label: 'Net', render: (r) => formatInr(r.net_total), align: 'right', sortAccessor: (r) => r.net_total },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={runStatusTone(r.status)}>{r.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHero
        eyebrow="Payroll"
        title="Controlled payroll cycle"
        subtitle="Open a monthly run, process statutory-aware payslips, approve net pay, then lock the cycle so figures stay immutable."
        actions={
          <>
            <HeroAction to="/payroll">Dashboard</HeroAction>
            {canWrite && (
              <Button className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20" onClick={() => { setSelected(null); setShowForm(true); }}>
                New Run
              </Button>
            )}
          </>
        }
      />
      <WorkflowStrip
        title={activeRun ? `Status · ${monthName(activeRun.period_month)} ${activeRun.period_year}` : 'Run progression'}
        steps={payrollWorkflowSteps(activeRun)}
      />
      <StatutorySummaryCards />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No payroll runs" description="Create a run for the current month to begin processing." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(r) => r.id}
            onRowClick={(r) => { setShowForm(false); setSelected(r); setActionError(null); }}
            selectedRowId={selected?.id}
            statusOptions={[
              { value: 'draft', label: 'Draft' },
              { value: 'review', label: 'Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'locked', label: 'Locked' },
            ]}
            statusAccessor={(r) => r.status}
          />
        </Card>
      )}

      <Drawer open={showForm} onClose={() => setShowForm(false)} eyebrow="Payroll cycle" title="New Payroll Run" subtitle="Open a monthly payroll period">
        <PayrollCreateRunForm onClose={() => setShowForm(false)} />
      </Drawer>

      <Drawer
        open={!!selected && !showForm}
        onClose={() => setSelected(null)}
        eyebrow="Payroll run"
        title={selected ? `${monthName(selected.period_month)} ${selected.period_year}` : 'Run'}
        badge={selected ? <Badge tone={runStatusTone(selected.status)}>{selected.status}</Badge> : undefined}
        meta={selected ? [
          { label: 'Employees', value: String(selected.employee_count) },
          { label: 'Gross', value: formatInr(selected.gross_total) },
          { label: 'Net', value: formatInr(selected.net_total) },
        ] : undefined}
      >
        {selected && (
          <PayrollActionChecklist
            selected={selected}
            actionError={actionError}
            canWrite={canWrite}
            canApprove={canApprove}
            processPending={processM.isPending}
            approvePending={approveM.isPending}
            lockPending={lockM.isPending}
            onProcess={() => processM.mutate(selected.id)}
            onApprove={() => approveM.mutate(selected.id)}
            onLock={() => lockM.mutate(selected.id)}
          />
        )}
      </Drawer>
    </div>
  );
}
