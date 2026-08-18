import { useQuery } from '@tanstack/react-query';
import { PageSpinner, ErrorBanner } from '../../components/ui/Feedback';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import {
  ExceptionPanel,
  FeatureCatalogue,
  QuickLinks,
  formatInr,
} from '../../components/erp/FeatureCatalogue';
import { payrollApi } from '../../lib/payrollApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import { PAYROLL_FEATURES, PAYROLL_LINKS, payrollWorkflowSteps } from './payrollWorkflow';

export function PayrollDashboardPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['payroll', 'dashboard', institutionId],
    queryFn: () => payrollApi.dashboard(institutionId),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <ErrorBanner message={apiErrorMessage(error)} />;

  const steps = payrollWorkflowSteps(data.pending_approval, data.latest_run_status);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow="26-step cycle · condensed"
        title="Payroll"
        subtitle="Open → attendance → earnings → statutory → review → approve → lock → bank advice → payslips → post to Accounts."
        actions={
          <>
            <HeroAction to="/payroll/runs">Runs</HeroAction>
            <HeroAction to="/payroll/payslips">Payslips</HeroAction>
          </>
        }
      />

      <WorkflowStrip title="Current cycle" steps={steps} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon="file" label="Runs this FY" value={String(data.runs_this_fy)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile
          icon="clock"
          label="Latest Run Status"
          value={data.latest_run_status?.replace(/_/g, ' ') ?? '—'}
          tone="bg-sky-50 text-sky-700"
        />
        <KpiTile
          icon="users"
          label="Employees Paid (last)"
          value={String(data.employees_paid_last_run)}
          tone="bg-gold-100 text-gold-700"
        />
        <KpiTile
          icon="wallet"
          label="Net Paid (last)"
          value={formatInr(data.net_paid_last_run)}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FeatureCatalogue title="Payroll capability" items={PAYROLL_FEATURES} />
        <ExceptionPanel
          title="Pending approval"
          empty="No payroll runs awaiting approval."
        >
          {data.pending_approval > 0 ? (
            <div>
              <p className="text-3xl font-semibold text-ink-900">{data.pending_approval}</p>
              <p className="mt-1 text-sm text-ink-500">
                Run(s) awaiting finance / HR approval before lock and bank advice.
              </p>
            </div>
          ) : null}
        </ExceptionPanel>
      </div>

      <QuickLinks links={PAYROLL_LINKS} />
    </div>
  );
}
