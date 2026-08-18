import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Feedback';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { FeatureCatalogue, QuickLinks } from '../../components/erp/FeatureCatalogue';
import { hrApi } from '../../lib/hrApi';
import { useAuthStore } from '../../state/authStore';
import { HR_FEATURES, HR_LINKS, HR_WORKFLOW } from './hrWorkflow';

function MixBar({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink-600">
        <span>{label}</span>
        <span className="font-medium text-ink-900">{count} · {pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function HrDashboardPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const { data, isLoading } = useQuery({
    queryKey: ['hr', 'dashboard', institutionId],
    queryFn: () => hrApi.dashboard(institutionId),
  });

  if (isLoading || !data) return <PageSpinner />;
  const total = data.total_employees || 1;
  const maxDept = Math.max(...data.by_department.map((d) => d.count), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow="People lifecycle"
        title="Human Resources"
        subtitle="From requisition to separation — employee master, faculty workload and secure identity data."
        actions={
          <>
            <HeroAction to="/hr/employees">Employees</HeroAction>
            <HeroAction to="/hr/designations">Designations</HeroAction>
          </>
        }
      />

      <WorkflowStrip title="HR workflow" steps={HR_WORKFLOW} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon="users" label="Total Headcount" value={String(data.total_employees)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile icon="users" label="Teaching" value={String(data.teaching_count)} tone="bg-sky-50 text-sky-700" />
        <KpiTile icon="users" label="Non-Teaching" value={String(data.non_teaching_count)} tone="bg-gold-100 text-gold-700" />
        <KpiTile icon="clock" label="On Probation" value={String(data.on_probation)} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Workforce snapshot</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-lg font-semibold text-ink-900">{data.active_count}</p>
                <p className="text-xs text-ink-500">Active</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-lg font-semibold text-ink-900">{data.on_leave}</p>
                <p className="text-xs text-ink-500">On leave</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-lg font-semibold text-ink-900">{data.new_joiners_90d}</p>
                <p className="text-xs text-ink-500">New joiners (90d)</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3">
                <p className="text-lg font-semibold text-ink-900">{data.probation_ending_30d}</p>
                <p className="text-xs text-ink-500">Probation ending</p>
              </div>
            </div>
            <MixBar label="Teaching" count={data.teaching_count} total={total} tone="bg-sky-500" />
            <MixBar label="Non-teaching" count={data.non_teaching_count} total={total} tone="bg-gold-500" />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Headcount by Department</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-3">
            {data.by_department.slice(0, 8).map((d) => (
              <div key={d.department_name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink-700">{d.department_name}</span>
                  <span className="font-medium text-ink-900">{d.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-crimson-500"
                    style={{ width: `${Math.round((d.count / maxDept) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {data.by_department.length === 0 && <p className="text-sm text-ink-400">No employees yet.</p>}
          </CardBody>
        </Card>
      </div>

      <FeatureCatalogue title="HR capability" items={HR_FEATURES} />
      <QuickLinks links={HR_LINKS} />
    </div>
  );
}
