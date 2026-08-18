import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatInr, formatInrCompact } from '../../components/erp/FeatureCatalogue';
import type { FeesOverview, NamedAmount } from '../../types/fees';

type OrgLevel = 'campus' | 'division' | 'department' | 'batch';

const LEVELS: { id: OrgLevel; label: string; key: keyof FeesOverview }[] = [
  { id: 'campus', label: 'Campus', key: 'by_campus' },
  { id: 'division', label: 'Division', key: 'by_division' },
  { id: 'department', label: 'Department', key: 'by_department' },
  { id: 'batch', label: 'Batch', key: 'by_batch' },
];

export function FeesOrgTab({
  data,
  onDrillStudents,
}: {
  data: FeesOverview;
  onDrillStudents: (filters: { campus?: string; division?: string; department?: string; batch?: string }) => void;
}) {
  const [level, setLevel] = useState<OrgLevel>('campus');
  const rows = useMemo(() => {
    const key = LEVELS.find((l) => l.id === level)!.key;
    return (data[key] as NamedAmount[]) ?? [];
  }, [data, level]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLevel(l.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              level === l.id ? 'bg-crimson-700 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending dues by {LEVELS.find((l) => l.id === level)?.label.toLowerCase()}</CardTitle>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rows.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8892a6" tickFormatter={(v) => formatInrCompact(Number(v))} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} stroke="#8892a6" />
              <Tooltip formatter={(v) => formatInr(Number(v))} />
              <Bar dataKey="amount" fill="#9b1b30" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Detail — click a row to open students</CardTitle></CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">{LEVELS.find((l) => l.id === level)?.label}</th>
                <th className="px-4 py-3 font-semibold">Fee lines</th>
                <th className="px-4 py-3 font-semibold text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className="cursor-pointer border-b border-ink-50 last:border-0 hover:bg-crimson-50/40"
                  onClick={() => onDrillStudents({ [level]: r.name })}
                >
                  <td className="px-4 py-3 font-medium text-ink-900">{r.name}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{r.count} lines</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold text-crimson-800">{formatInr(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
