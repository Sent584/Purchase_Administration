import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatInr, formatInrCompact } from '../../components/erp/FeatureCatalogue';
import type { FeesOverview } from '../../types/fees';

const COLORS = ['#9b1b30', '#c9a227', '#0284c7', '#059669', '#b45309', '#7d1628', '#64748b'];

export function FeesCharts({ data }: { data: FeesOverview }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Pending by programme</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.by_programme} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8892a6" tickFormatter={(v) => formatInrCompact(Number(v))} />
              <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} stroke="#8892a6" />
              <Tooltip formatter={(v) => formatInr(Number(v))} />
              <Bar dataKey="amount" fill="#9b1b30" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>By fee category</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.by_category} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                {data.by_category.map((_, i) => (
                  <Cell key={data.by_category[i].name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatInr(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1.5">
            {data.by_category.map((c, i) => (
              <li key={c.name} className="flex items-center justify-between gap-2 text-xs text-ink-600">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {c.name}
                </span>
                <span className="font-medium text-ink-800">{formatInrCompact(c.amount)}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>By year of study</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_year}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#8892a6" />
              <YAxis tick={{ fontSize: 11 }} stroke="#8892a6" tickFormatter={(v) => formatInrCompact(Number(v))} />
              <Tooltip formatter={(v) => formatInr(Number(v))} />
              <Bar dataKey="amount" fill="#c9a227" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Due timeline</CardTitle></CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_due_bucket}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#8892a6" />
              <YAxis tick={{ fontSize: 11 }} stroke="#8892a6" tickFormatter={(v) => formatInrCompact(Number(v))} />
              <Tooltip formatter={(v) => formatInr(Number(v))} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {data.by_due_bucket.map((b) => (
                  <Cell key={b.name} fill={b.name === 'Overdue' ? '#9b1b30' : b.name.includes('30') ? '#b45309' : '#059669'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
