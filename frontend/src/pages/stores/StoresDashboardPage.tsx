import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Feedback';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { FeatureCatalogue, QuickLinks, formatInr } from '../../components/erp/FeatureCatalogue';
import { stockApi, storesApi } from '../../lib/storesApi';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import { STORES_FEATURES, STORES_LINKS, storesWorkflowSteps } from './storesWorkflow';

const CHART_COLORS = ['#9b1b30', '#c9a227', '#0284c7', '#059669', '#7d1628', '#a5811d'];

export function StoresDashboardPage() {
  const { institutionId } = usePurchaseInstitution();
  const dashQ = useQuery({ queryKey: ['stores', 'dashboard', institutionId], queryFn: () => stockApi.dashboard(institutionId || undefined) });
  const storesQ = useQuery({ queryKey: ['stores', 'list', institutionId], queryFn: () => storesApi.list(institutionId || undefined) });
  const stockQ = useQuery({
    queryKey: ['stores', 'stock', institutionId],
    queryFn: () => stockApi.balances({ institutionId: institutionId || undefined }),
  });

  const charts = useMemo(() => {
    const byType = new Map<string, number>();
    for (const s of storesQ.data ?? []) {
      const label = s.store_type.replace(/_/g, ' ');
      byType.set(label, (byType.get(label) ?? 0) + 1);
    }
    const typeData = Array.from(byType.entries()).map(([name, value]) => ({ name, value }));
    const byStore = new Map<string, number>();
    for (const b of stockQ.data ?? []) {
      byStore.set(b.store_name, (byStore.get(b.store_name) ?? 0) + b.valuation);
    }
    const valueData = Array.from(byStore.entries())
      .map(([store, value]) => ({ store, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    return { typeData, valueData };
  }, [storesQ.data, stockQ.data]);

  if (dashQ.isLoading || storesQ.isLoading || stockQ.isLoading) return <PageSpinner />;
  const d = dashQ.data;
  const below = d?.below_reorder ?? 0;
  const pending = d?.pending_issues ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow="Inventory control"
        title="Stores & Inventory"
        subtitle="Opening/GRN → putaway → issue → transfer → adjustment → physical verification across campus stores."
        actions={
          <>
            <HeroAction to="/stores/stock">Stock ledger</HeroAction>
            <HeroAction to="/stores/issues">Issues</HeroAction>
          </>
        }
      />

      <WorkflowStrip title="Stores workflow" steps={storesWorkflowSteps(below, pending)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiTile icon="building" label="Active Stores" value={String(d?.store_count ?? 0)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile icon="box" label="Items in Stock" value={String(d?.item_count ?? 0)} tone="bg-sky-50 text-sky-700" />
        <KpiTile icon="wallet" label="Stock Value" value={formatInr(d?.total_stock_value ?? 0)} tone="bg-gold-100 text-gold-700" />
        <KpiTile icon="clock" label="Below Reorder" value={String(below)} tone="bg-amber-50 text-amber-700" />
        <KpiTile icon="file" label="Pending Issues" value={String(pending)} tone="bg-emerald-50 text-emerald-700" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Stock Value by Store</CardTitle></CardHeader>
          <CardBody>
            {charts.valueData.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">No stock balances yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.valueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                  <XAxis dataKey="store" tick={{ fontSize: 11 }} stroke="#8892a6" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#8892a6" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatInr(Number(v))} />
                  <Bar dataKey="value" fill="#9b1b30" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stores by Type</CardTitle></CardHeader>
          <CardBody>
            {charts.typeData.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">No stores yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={charts.typeData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2}>
                    {charts.typeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FeatureCatalogue title="Stores capability" items={STORES_FEATURES} />
        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-3">
            {(d?.recent_txns ?? []).length === 0 ? (
              <p className="text-sm text-ink-400">No stock movements yet.</p>
            ) : (
              d?.recent_txns.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-ink-800">{t.item_name} · {t.store_name}</p>
                    <p className="font-mono text-xs text-ink-400">
                      {t.txn_number} · {t.txn_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="font-medium text-ink-900">
                    {t.quantity} {t.uom}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <QuickLinks links={STORES_LINKS} />
    </div>
  );
}
