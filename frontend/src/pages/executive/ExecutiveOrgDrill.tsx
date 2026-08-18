import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatInr } from '../../components/erp/FeatureCatalogue';
import type { OrgMetricPoint } from '../../types/executive';

function DualBar({
  title,
  data,
  onSelect,
  selected,
}: {
  title: string;
  data: OrgMetricPoint[];
  onSelect?: (name: string) => void;
  selected?: string;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">No org data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 12 }}
              onClick={(state) => {
                const label = (state as { activeLabel?: string })?.activeLabel;
                if (label && onSelect) onSelect(label);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8892a6" />
              <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11 }} stroke="#8892a6" />
              <Tooltip
                formatter={(v, name) =>
                  name === 'spend' || name === 'stock_value'
                    ? formatInr(Number(v))
                    : Number(v)
                }
              />
              <Legend />
              <Bar
                dataKey="spend"
                name="PO spend"
                fill={selected ? '#7f1d1d' : '#9b1b30'}
                radius={[0, 4, 4, 0]}
                cursor="pointer"
              />
              <Bar dataKey="headcount" name="Headcount" fill="#c9a227" radius={[0, 4, 4, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  );
}

export function ExecutiveOrgDrill({
  byCampus,
  byDivision,
  byDepartment,
  selectedCampus,
  selectedDivision,
  selectedDepartment,
  onSelectCampus,
  onSelectDivision,
  onSelectDepartment,
}: {
  byCampus: OrgMetricPoint[];
  byDivision: OrgMetricPoint[];
  byDepartment: OrgMetricPoint[];
  selectedCampus?: string;
  selectedDivision?: string;
  selectedDepartment?: string;
  onSelectCampus: (name: string) => void;
  onSelectDivision: (name: string) => void;
  onSelectDepartment: (name: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">Organisation drill-down</h2>
        <p className="text-sm text-ink-500">
          Click a campus, division or department bar to focus the command centre. Spend vs headcount side by side.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <DualBar title="By Campus" data={byCampus} selected={selectedCampus} onSelect={onSelectCampus} />
        <DualBar title="By Division" data={byDivision} selected={selectedDivision} onSelect={onSelectDivision} />
        <DualBar title="By Department" data={byDepartment} selected={selectedDepartment} onSelect={onSelectDepartment} />
      </div>
    </section>
  );
}
