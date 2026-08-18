import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatInr } from '../../components/erp/FeatureCatalogue';
import type { ChartPoint } from './purchaseDashboardMetrics';

function OrgBar({ title, data, valueLabel }: { title: string; data: ChartPoint[]; valueLabel: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8892a6" />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="#8892a6" />
              <Tooltip
                formatter={(v) =>
                  valueLabel === 'spend' ? formatInr(Number(v)) : `${Number(v)} PR(s)`
                }
              />
              <Bar dataKey="value" fill="#9b1b30" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  );
}

export function PurchaseOrgOverview({
  byCampus,
  byDivision,
  byDepartment,
  openPrByDivision,
}: {
  byCampus: ChartPoint[];
  byDivision: ChartPoint[];
  byDepartment: ChartPoint[];
  openPrByDivision: ChartPoint[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Director overview</h2>
        <p className="text-sm text-ink-500">Purchase spend and pipeline by campus, division and department.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <OrgBar title="PO Spend by Campus" data={byCampus} valueLabel="spend" />
        <OrgBar title="PO Spend by Division" data={byDivision} valueLabel="spend" />
        <OrgBar title="PO Spend by Department" data={byDepartment} valueLabel="spend" />
        <OrgBar title="Open Requisitions by Division" data={openPrByDivision} valueLabel="count" />
      </div>
    </section>
  );
}
