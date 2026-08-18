import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageSpinner, ErrorBanner } from '../../components/ui/Feedback';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import {
  FeatureCatalogue,
  QuickLinks,
  formatInr,
  formatInrCompact,
} from '../../components/erp/FeatureCatalogue';
import { accountsApi } from '../../lib/accountsApi';
import { feesApi } from '../../lib/feesApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import { ACCOUNTS_FEATURES, ACCOUNTS_LINKS, accountsWorkflowSteps } from './accountsWorkflow';

export function AccountsDashboardPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['accounts', 'dashboard', institutionId],
    queryFn: () => accountsApi.dashboard(institutionId),
  });
  const feesQ = useQuery({
    queryKey: ['fees', 'overview'],
    queryFn: () => feesApi.overview(),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <ErrorBanner message={apiErrorMessage(error)} />;

  const util = Math.min(100, Math.max(0, data.budget_utilised_pct));
  const fees = feesQ.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow={`FY ${data.fy_label}`}
        title="Accounts & Finance"
        subtitle="Draft → validate → approve → post (immutable) → statements. Multi-fund GL with commitment accounting."
        actions={
          <>
            <HeroAction to="/fees">Student Fees</HeroAction>
            <HeroAction to="/accounts/vouchers">Vouchers</HeroAction>
            <HeroAction to="/accounts/trial-balance">Trial balance</HeroAction>
          </>
        }
      />

      <WorkflowStrip title="Voucher lifecycle" steps={accountsWorkflowSteps(data.pending_vouchers, data.posted_vouchers)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon="wallet" label="Cash Position" value={formatInrCompact(data.cash_position)} tone="bg-crimson-50 text-crimson-700" sub={formatInr(data.cash_position)} />
        <KpiTile icon="chart" label="Budget Utilised" value={`${data.budget_utilised_pct.toFixed(1)}%`} tone="bg-gold-100 text-gold-700" />
        <KpiTile icon="file" label="Pending Vouchers" value={String(data.pending_vouchers)} tone="bg-amber-50 text-amber-700" />
        <KpiTile icon="building" label="Bank Accounts" value={String(data.bank_accounts)} tone="bg-sky-50 text-sky-700" />
      </div>

      {fees && (
        <Card className="overflow-hidden border-crimson-100 bg-gradient-to-r from-crimson-50 via-white to-gold-50">
          <CardBody className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-crimson-700">Student Fees Overview</p>
              <p className="mt-1 font-heading text-2xl font-semibold text-ink-900">{formatInrCompact(fees.total_pending)} pending</p>
              <p className="mt-1 text-sm text-ink-600">
                {fees.line_count} lines · {formatInrCompact(fees.overdue_amount)} overdue · {fees.programmes} programmes
              </p>
            </div>
            <Link to="/fees"><Button>Open fees analytics</Button></Link>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Budget utilisation</CardTitle></CardHeader>
        <CardBody>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-ink-600">FY {data.fy_label} committed vs allocated</span>
            <span className="font-semibold text-ink-900">{util.toFixed(1)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${util >= 90 ? 'bg-crimson-600' : util >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${util}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-ink-500">
            {data.posted_vouchers} vouchers posted this FY · {data.pending_vouchers} awaiting approval.
          </p>
        </CardBody>
      </Card>

      <FeatureCatalogue title="Finance capability" items={ACCOUNTS_FEATURES} />
      <QuickLinks links={ACCOUNTS_LINKS} />
    </div>
  );
}
