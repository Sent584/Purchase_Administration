import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import type { HomeSeriesPoint } from '../../types/roleHome';

export function AnalyticsBars({
  title,
  unit,
  series,
}: {
  title: string;
  unit: string;
  series: HomeSeriesPoint[];
}) {
  const max = Math.max(...series.map((s) => s.value), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {series.length === 0 ? (
          <p className="text-sm text-ink-400">No series data for this role yet.</p>
        ) : (
          series.map((s) => {
            const pct = Math.max(4, Math.round((s.value / max) * 100));
            return (
              <div key={s.label}>
                <div className="mb-1 flex justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-ink-700">{s.label}</span>
                  <span className="shrink-0 text-ink-500">
                    {unit === '₹'
                      ? `₹${s.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                      : `${s.value.toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-crimson-700 to-gold-500 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
