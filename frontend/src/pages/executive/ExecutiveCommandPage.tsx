import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { PageSpinner } from '../../components/ui/Feedback';
import { KpiTile } from '../../components/erp/PageHero';
import { formatInr } from '../../components/erp/FeatureCatalogue';
import { executiveApi } from '../../lib/executiveApi';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import { ExecutiveFunctionGrid } from './ExecutiveFunctionGrid';
import { ExecutiveOrgDrill } from './ExecutiveOrgDrill';

function formatCompact(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return formatInr(n);
}

export function ExecutiveCommandPage() {
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [campus, setCampus] = useState('');
  const [division, setDivision] = useState('');
  const [department, setDepartment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['executive', 'overview', institutionId || 'all'],
    queryFn: () => executiveApi.overview(institutionId || undefined),
  });
  const approvalsQ = useQuery({
    queryKey: ['executive', 'approvals', institutionId || 'all'],
    queryFn: () => executiveApi.approvals(institutionId || undefined),
  });

  const filtered = useMemo(() => {
    if (!data) return null;
    const match = (name: string, selected: string) => !selected || name === selected;
    return {
      ...data,
      by_campus: data.by_campus.filter((r) => match(r.name, campus)),
      by_division: data.by_division.filter((r) => match(r.name, division) || !division),
      by_department: data.by_department.filter((r) => match(r.name, department) || !department),
    };
  }, [data, campus, division, department]);

  if (isLoading || !filtered) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-crimson-900 via-crimson-800 to-ink-900 text-white shadow-lg">
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-200">Chairman / Director desk</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Executive Command Centre</h1>
              <p className="mt-3 text-sm leading-relaxed text-crimson-100/90 sm:text-base">
                One pane across campuses, divisions and departments — Purchase, People, Finance, Stores, Assets and Payroll.
                Drill down where it matters; act on approvals without leaving the executive desk.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/fees">
                <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Student Fees
                </Button>
              </Link>
              <Link to="/executive/approvals">
                <Button className="bg-gold-500 text-ink-900 hover:bg-gold-400">
                  Approvals inbox
                  {(approvalsQ.data?.total ?? 0) > 0 ? ` (${approvalsQ.data?.total})` : ''}
                </Button>
              </Link>
            </div>
          </div>
          {(needsInstitutionPicker || campus || division || department) && (
            <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
              {needsInstitutionPicker && (
                <Select label="Institution" className="min-w-[200px]" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                  <option value="">All institutions</option>
                  {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </Select>
              )}
              {(campus || division || department) && (
                <Button size="sm" variant="secondary" onClick={() => { setCampus(''); setDivision(''); setDepartment(''); }}>
                  Clear org focus
                </Button>
              )}
              {campus && <Badge tone="gold">Campus: {campus}</Badge>}
              {division && <Badge tone="gold">Division: {division}</Badge>}
              {department && <Badge tone="gold">Dept: {department}</Badge>}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile icon="building" label="Campuses" value={String(filtered.campuses)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile icon="users" label="Headcount" value={String(filtered.headcount)} tone="bg-sky-50 text-sky-700" />
        <KpiTile icon="cart" label="PO spend" value={formatCompact(filtered.po_spend)} tone="bg-emerald-50 text-emerald-700" />
        <KpiTile icon="wallet" label="Cash" value={formatCompact(filtered.cash_position)} tone="bg-gold-100 text-gold-700" />
        <KpiTile icon="box" label="Stock value" value={formatCompact(filtered.stock_value)} tone="bg-amber-50 text-amber-700" />
        <KpiTile icon="shield" label="Pending approvals" value={String(approvalsQ.data?.total ?? filtered.pending_approvals)} sub={`${filtered.attendance_pct}% present today`} tone="bg-ink-100 text-ink-700" />
      </div>

      <ExecutiveFunctionGrid functions={filtered.functions} />

      <ExecutiveOrgDrill
        byCampus={data!.by_campus}
        byDivision={data!.by_division}
        byDepartment={data!.by_department}
        selectedCampus={campus}
        selectedDivision={division}
        selectedDepartment={department}
        onSelectCampus={(n) => { setCampus(n); setDivision(''); setDepartment(''); }}
        onSelectDivision={(n) => { setDivision(n); setDepartment(''); }}
        onSelectDepartment={setDepartment}
      />
    </div>
  );
}
