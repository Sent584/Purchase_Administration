import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageSpinner } from '../../components/ui/Feedback';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import {
  ExceptionPanel,
  FeatureCatalogue,
  QuickLinks,
  formatInr,
  formatInrCompact,
} from '../../components/erp/FeatureCatalogue';
import { billApi, grnApi, indentApi, poApi, quotationApi, vendorApi } from '../../lib/purchaseApi';
import { useAuthStore } from '../../state/authStore';
import { computePurchaseMetrics } from './purchaseDashboardMetrics';
import { requisitionCountByField, spendByOrgField } from './orgDashboardMetrics';
import { PurchaseSpendCharts } from './PurchaseSpendCharts';
import { PurchaseOrgOverview } from './PurchaseOrgOverview';
import { PURCHASE_FEATURES, PURCHASE_LINKS, purchaseWorkflowSteps } from './purchaseWorkflow';

export function PurchaseDashboardPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const vendorsQ = useQuery({ queryKey: ['purchase', 'vendors', institutionId], queryFn: () => vendorApi.list(institutionId) });
  const indentsQ = useQuery({ queryKey: ['purchase', 'indents', institutionId], queryFn: () => indentApi.list(institutionId) });
  const quotationsQ = useQuery({ queryKey: ['purchase', 'quotations', institutionId], queryFn: () => quotationApi.list(institutionId) });
  const posQ = useQuery({ queryKey: ['purchase', 'orders', institutionId], queryFn: () => poApi.list(institutionId) });
  const grnsQ = useQuery({ queryKey: ['purchase', 'grns', institutionId], queryFn: () => grnApi.list(institutionId) });
  const billsQ = useQuery({ queryKey: ['purchase', 'bills', institutionId], queryFn: () => billApi.list(institutionId) });

  const loading =
    vendorsQ.isLoading || indentsQ.isLoading || quotationsQ.isLoading || posQ.isLoading || grnsQ.isLoading || billsQ.isLoading;

  const metrics = useMemo(
    () =>
      computePurchaseMetrics(
        vendorsQ.data ?? [],
        indentsQ.data ?? [],
        quotationsQ.data ?? [],
        posQ.data ?? [],
        grnsQ.data ?? [],
        billsQ.data ?? [],
      ),
    [vendorsQ.data, indentsQ.data, quotationsQ.data, posQ.data, grnsQ.data, billsQ.data],
  );

  const orgMetrics = useMemo(() => {
    const pos = posQ.data ?? [];
    const indents = indentsQ.data ?? [];
    return {
      byCampus: spendByOrgField(pos, 'campus_name'),
      byDivision: spendByOrgField(pos, 'division_name'),
      byDepartment: spendByOrgField(pos, 'department_name'),
      openPrByDivision: requisitionCountByField(
        indents.filter((i) => i.status === 'submitted' || i.status === 'draft'),
        'division_name',
      ),
    };
  }, [posQ.data, indentsQ.data]);

  if (loading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow="Procure-to-Pay"
        title="Purchase Overview"
        subtitle="Director view of procurement across campuses, divisions and departments — requisition through payment."
        actions={
          <>
            <HeroAction to="/purchase/requisitions">New requisition</HeroAction>
            <HeroAction to="/purchase/quotations">RFQs</HeroAction>
            <HeroAction to="/purchase/orders">Purchase orders</HeroAction>
          </>
        }
      />

      <WorkflowStrip title="Live pipeline" steps={purchaseWorkflowSteps(metrics)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiTile icon="wallet" label="PO Spend" value={formatInrCompact(metrics.totalSpend)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile icon="file" label="Open PRs" value={String(metrics.openIndents)} tone="bg-sky-50 text-sky-700" />
        <KpiTile icon="chart" label="Pending Award" value={String(metrics.pendingQuotations)} tone="bg-gold-100 text-gold-700" />
        <KpiTile icon="server" label="Awaiting GRN" value={String(metrics.posAwaitingGrn)} tone="bg-amber-50 text-amber-700" />
        <KpiTile icon="wallet" label="Bills Approval" value={String(metrics.billsPendingApproval)} tone="bg-emerald-50 text-emerald-700" />
        <KpiTile icon="cart" label="Active Vendors" value={String(metrics.activeVendors)} tone="bg-ink-100 text-ink-600" />
      </div>

      <PurchaseOrgOverview {...orgMetrics} />

      <PurchaseSpendCharts trendData={metrics.trendData} methodData={metrics.methodData} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FeatureCatalogue title="Procurement capability" items={PURCHASE_FEATURES} />
        <ExceptionPanel title="Exceptions & pipeline" empty="No MSME alerts or pending items.">
          {metrics.msmeAlerts.length === 0 &&
          metrics.openIndents === 0 &&
          metrics.pendingQuotations === 0 &&
          metrics.posAwaitingGrn === 0
            ? undefined
            : (
              <>
                {metrics.msmeAlerts.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-ink-800">{b.vendor_name}</p>
                      <p className="font-mono text-xs text-ink-400">{b.bill_number}</p>
                    </div>
                    <Badge tone={b.daysLeft < 0 ? 'danger' : b.daysLeft <= 3 ? 'warning' : 'gold'}>
                      {b.daysLeft < 0 ? `${-b.daysLeft}d overdue` : `${b.daysLeft}d left`}
                    </Badge>
                  </div>
                ))}
                {metrics.openIndents > 0 && (
                  <p className="text-sm text-ink-600">{metrics.openIndents} open requisition(s) awaiting approval.</p>
                )}
                {metrics.pendingQuotations > 0 && (
                  <p className="text-sm text-ink-600">{metrics.pendingQuotations} RFQ(s) pending award.</p>
                )}
                {metrics.posAwaitingGrn > 0 && (
                  <p className="text-sm text-ink-600">{metrics.posAwaitingGrn} PO(s) awaiting GRN.</p>
                )}
              </>
            )}
        </ExceptionPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Vendors</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-3">
            {metrics.topVendors.length === 0 ? (
              <p className="text-sm text-ink-400">No spend recorded yet.</p>
            ) : (
              metrics.topVendors.map((v, i) => (
                <div key={v.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-[10px] font-semibold">
                      {i + 1}
                    </span>
                    {v.name}
                  </span>
                  <span className="font-medium text-ink-900">{formatInr(v.value)}</span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-3">
            {metrics.activity.length === 0 ? (
              <p className="text-sm text-ink-400">No activity yet.</p>
            ) : (
              metrics.activity.map((a) => (
                <div key={`${a.type}-${a.id}`} className="flex items-center gap-2 text-sm">
                  <Icon name={a.icon} className="h-4 w-4 shrink-0 text-ink-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ink-800">{a.type} · {a.label}</p>
                    <p className="font-mono text-xs text-ink-400">{a.number}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <QuickLinks links={PURCHASE_LINKS} />
    </div>
  );
}
