import type { IndentOut, OrgScopeFields, PurchaseOrderOut } from '../../types/purchase';
import type { ChartPoint } from './purchaseDashboardMetrics';

function bucketSpend(items: { name: string; value: number }[]): ChartPoint[] {
  return items
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map(({ name, value }) => ({ name, value }));
}

function accumulate(
  map: Map<string, number>,
  key: string,
  amount: number,
) {
  const label = key.trim() || 'Unassigned';
  map.set(label, (map.get(label) ?? 0) + amount);
}

export function spendByOrgField(pos: PurchaseOrderOut[], field: keyof OrgScopeFields): ChartPoint[] {
  const map = new Map<string, number>();
  for (const po of pos) {
    if (po.status === 'cancelled' || po.status === 'draft') continue;
    const raw = po[field];
    accumulate(map, typeof raw === 'string' ? raw : '', po.grand_total);
  }
  return bucketSpend(Array.from(map.entries()).map(([name, value]) => ({ name, value })));
}

export function requisitionCountByField(indents: IndentOut[], field: 'campus_name' | 'division_name' | 'department_name'): ChartPoint[] {
  const map = new Map<string, number>();
  for (const pr of indents) {
    accumulate(map, pr[field] || '', 1);
  }
  return bucketSpend(Array.from(map.entries()).map(([name, value]) => ({ name, value })));
}

export interface DirectorOrgMetrics {
  byCampus: ChartPoint[];
  byDivision: ChartPoint[];
  byDepartment: ChartPoint[];
  openPrByDivision: ChartPoint[];
}
