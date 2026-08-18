import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { Select } from '../../components/ui/Select';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero, HeroAction } from '../../components/erp/PageHero';
import { payrollApi } from '../../lib/payrollApi';
import { useAuthStore } from '../../state/authStore';
import type { PayslipOut } from '../../types/payroll';
import { formatInr } from './payrollHelpers';
import { PayslipPreview } from './PayslipPreview';

export function PayslipsPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const [params] = useSearchParams();
  const runFromUrl = params.get('run') ?? '';
  const [runId, setRunId] = useState(runFromUrl);
  const [selected, setSelected] = useState<PayslipOut | null>(null);

  const runsQ = useQuery({
    queryKey: ['payroll', 'runs', institutionId],
    queryFn: () => payrollApi.listRuns(institutionId),
  });

  const slipsQ = useQuery({
    queryKey: ['payroll', 'payslips', runId || 'all', institutionId],
    queryFn: () => payrollApi.listPayslips(runId || undefined, institutionId),
  });

  const columns: DataTableColumn<PayslipOut>[] = useMemo(
    () => [
      { key: 'code', label: 'Code', render: (p) => <span className="font-mono text-ink-600">{p.employee_code}</span> },
      { key: 'name', label: 'Employee', render: (p) => <span className="font-medium text-ink-900">{p.employee_name}</span>, sortAccessor: (p) => p.employee_name },
      { key: 'desig', label: 'Designation', render: (p) => p.designation },
      { key: 'gross', label: 'Gross', render: (p) => formatInr(p.gross), align: 'right', sortAccessor: (p) => p.gross },
      { key: 'net', label: 'Net', render: (p) => formatInr(p.net), align: 'right', sortAccessor: (p) => p.net },
      { key: 'status', label: 'Status', render: (p) => <Badge tone={p.status === 'final' ? 'success' : 'neutral'}>{p.status}</Badge> },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHero
        eyebrow="Payroll"
        title="Payslips"
        subtitle="Branded employee payslips with earnings, deductions, employer contributions, YTD totals and QR verification."
        actions={<HeroAction to="/payroll/runs">Payroll runs</HeroAction>}
      />
      <div className="max-w-xs">
        <Select label="Payroll run" value={runId} onChange={(e) => { setRunId(e.target.value); setSelected(null); }}>
          <option value="">All runs</option>
          {(runsQ.data ?? []).map((r) => (
            <option key={r.id} value={r.id}>{r.period_month}/{r.period_year} · {r.status}</option>
          ))}
        </Select>
      </div>

      {slipsQ.isLoading ? (
        <PageSpinner />
      ) : !slipsQ.data || slipsQ.data.length === 0 ? (
        <Card><CardBody><EmptyState title="No payslips" description="Payslips appear after a payroll run is processed." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={slipsQ.data}
            columns={columns}
            getRowId={(p) => p.id}
            onRowClick={setSelected}
            selectedRowId={selected?.id}
            searchPlaceholder="Search employees…"
            searchAccessor={(p) => `${p.employee_name} ${p.employee_code} ${p.designation}`}
          />
        </Card>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Payslip preview"
        title={selected?.employee_name ?? 'Payslip'}
        subtitle={selected ? `${selected.employee_code} · ${selected.designation}` : undefined}
        badge={selected ? <Badge tone={selected.status === 'final' ? 'success' : 'neutral'}>{selected.status}</Badge> : undefined}
        meta={selected ? [
          { label: 'Gross', value: formatInr(selected.gross) },
          { label: 'Net', value: formatInr(selected.net) },
        ] : undefined}
      >
        {selected && <PayslipPreview slip={selected} />}
      </Drawer>
    </div>
  );
}
