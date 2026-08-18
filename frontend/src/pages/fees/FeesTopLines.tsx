import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatInr } from '../../components/erp/FeatureCatalogue';
import type { FeeLine } from '../../types/fees';

function bucketTone(bucket: string): 'danger' | 'warning' | 'success' | 'neutral' {
  if (bucket === 'Overdue') return 'danger';
  if (bucket.includes('30')) return 'warning';
  if (bucket.includes('90')) return 'neutral';
  return 'success';
}

export function FeesTopLines({ lines }: { lines: FeeLine[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Largest pending lines</CardTitle>
      </CardHeader>
      <CardBody className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Fee type</th>
              <th className="px-4 py-3 font-semibold">Programme / Year</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={`${line.programme}-${line.type_name}-${line.due_date}`} className="border-b border-ink-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{line.type_name}</p>
                  <p className="text-xs text-ink-500">{line.category}</p>
                </td>
                <td className="px-4 py-3 text-ink-700">
                  <p>{line.programme}</p>
                  <p className="text-xs text-ink-500">{line.year}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-ink-700">{line.due_date}</span>
                    <Badge tone={bucketTone(line.due_bucket)}>{line.due_bucket}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-crimson-800">{formatInr(line.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
