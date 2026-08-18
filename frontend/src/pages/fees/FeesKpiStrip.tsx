import { KpiTile } from '../../components/erp/PageHero';
import { formatInr, formatInrCompact } from '../../components/erp/FeatureCatalogue';
import type { FeesOverview } from '../../types/fees';

export function FeesKpiStrip({ data }: { data: FeesOverview }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiTile
        icon="wallet"
        label="Total Pending"
        value={formatInrCompact(data.total_pending)}
        sub={formatInr(data.total_pending)}
        tone="bg-crimson-50 text-crimson-700"
      />
      <KpiTile
        icon="clock"
        label="Overdue"
        value={formatInrCompact(data.overdue_amount)}
        sub={formatInr(data.overdue_amount)}
        tone="bg-amber-50 text-amber-700"
      />
      <KpiTile
        icon="trendUp"
        label="Due in 30 days"
        value={formatInrCompact(data.due_soon_amount)}
        tone="bg-gold-100 text-gold-700"
      />
      <KpiTile
        icon="building"
        label="Programmes"
        value={String(data.programmes)}
        sub={`${data.fee_categories} fee categories`}
        tone="bg-sky-50 text-sky-700"
      />
      <KpiTile
        icon="file"
        label="Students"
        value={String(data.student_count)}
        sub={`${data.line_count} fee lines`}
        tone="bg-emerald-50 text-emerald-700"
      />
    </div>
  );
}
