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
import { formatInr } from '../../components/erp/FeatureCatalogue';
import type { ChartPoint, TrendPoint } from './purchaseDashboardMetrics';

const CHART_COLORS = ['#9b1b30', '#c9a227', '#0284c7', '#059669', '#7d1628', '#a5811d'];

export function PurchaseSpendCharts({
  trendData,
  methodData,
}: {
  trendData: TrendPoint[];
  methodData: ChartPoint[];
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Monthly PO Spend</CardTitle></CardHeader>
        <CardBody>
          {trendData.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No purchase orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#8892a6" />
                <YAxis tick={{ fontSize: 12 }} stroke="#8892a6" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatInr(Number(v))} />
                <Bar dataKey="spend" fill="#9b1b30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>By Method</CardTitle></CardHeader>
        <CardBody>
          {methodData.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No POs yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2}>
                  {methodData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatInr(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
