import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Feedback';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { FeatureCatalogue, QuickLinks } from '../../components/erp/FeatureCatalogue';
import { assetsApi } from '../../lib/assetsApi';
import { useAuthStore } from '../../state/authStore';
import { classLabel, formatInr } from './assetHelpers';
import { ASSETS_FEATURES, ASSETS_LINKS, assetsWorkflowSteps } from './assetsWorkflow';

export function AssetsDashboardPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const { data, isLoading } = useQuery({
    queryKey: ['assets', 'dashboard', institutionId],
    queryFn: () => assetsApi.dashboard(institutionId),
  });

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow="Fixed assets"
        title="Asset Management"
        subtitle="Capitalise from GRN → allocate custodian → depreciate → transfer → verify → dispose."
        actions={<HeroAction to="/assets/register">Asset register</HeroAction>}
      />

      <WorkflowStrip
        title="Asset lifecycle"
        steps={assetsWorkflowSteps(data.amc_expiring_30d, data.warranty_expiring_30d)}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon="server" label="Total Assets" value={String(data.total_assets)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile
          icon="wallet"
          label="Capitalization"
          value={formatInr(data.total_capitalization_value)}
          tone="bg-gold-100 text-gold-700"
        />
        <KpiTile
          icon="chart"
          label="Book Value"
          value={formatInr(data.total_book_value)}
          tone="bg-sky-50 text-sky-700"
        />
        <KpiTile
          icon="alert"
          label="Warranty (30d)"
          value={String(data.warranty_expiring_30d)}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>By Asset Class</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-3">
            {data.by_class.length === 0 ? (
              <p className="text-sm text-ink-400">No assets yet.</p>
            ) : (
              data.by_class.map((c) => (
                <div key={c.asset_class} className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">{classLabel(c.asset_class)}</span>
                  <span className="font-medium text-ink-900">
                    {c.count} · {formatInr(c.total_value)}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status Snapshot</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-lg font-semibold text-ink-900">{data.active_count}</p>
              <p className="text-xs text-ink-500">Active</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-lg font-semibold text-ink-900">{data.under_repair_count}</p>
              <p className="text-xs text-ink-500">Under repair</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-lg font-semibold text-ink-900">{data.disposed_count}</p>
              <p className="text-xs text-ink-500">Disposed / written off</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-lg font-semibold text-ink-900">{data.amc_expiring_30d}</p>
              <p className="text-xs text-ink-500">AMC expiring (30d)</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <FeatureCatalogue title="Asset capability" items={ASSETS_FEATURES} />
      <QuickLinks links={ASSETS_LINKS} />
    </div>
  );
}
