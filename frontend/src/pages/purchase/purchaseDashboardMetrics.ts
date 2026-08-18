import type {
  GrnOut,
  IndentOut,
  PurchaseBillOut,
  PurchaseOrderOut,
  QuotationOut,
  VendorOut,
} from '../../types/purchase';

export type ChartPoint = { name: string; value: number };
export type TrendPoint = { month: string; spend: number };
export type MsmeAlert = PurchaseBillOut & { daysLeft: number };
export type ActivityItem = {
  id: string;
  type: string;
  label: string;
  number: string;
  at: string;
  icon: 'file' | 'chart' | 'server' | 'box' | 'wallet';
};

export interface PurchaseMetrics {
  totalSpend: number;
  openIndents: number;
  pendingQuotations: number;
  posAwaitingGrn: number;
  billsPendingApproval: number;
  activeVendors: number;
  grnCount: number;
  billsReady: number;
  trendData: TrendPoint[];
  methodData: ChartPoint[];
  topVendors: ChartPoint[];
  msmeAlerts: MsmeAlert[];
  activity: ActivityItem[];
}

export function computePurchaseMetrics(
  vendors: VendorOut[],
  indents: IndentOut[],
  quotations: QuotationOut[],
  pos: PurchaseOrderOut[],
  grns: GrnOut[],
  bills: PurchaseBillOut[],
): PurchaseMetrics {
  const activePos = pos.filter((p) => p.status !== 'cancelled' && p.status !== 'draft');
  const totalSpend = activePos.reduce((sum, p) => sum + p.grand_total, 0);
  const openIndents = indents.filter((i) => i.status === 'submitted').length;
  const pendingQuotations = quotations.filter((q) => q.status === 'quotes_received').length;
  const posAwaitingGrn = pos.filter((p) => p.status === 'issued').length;
  const billsPendingApproval = bills.filter((b) => b.status === 'booked').length;
  const activeVendors = vendors.filter((v) => v.status === 'active').length;
  const billsReady = bills.filter((b) => b.status === 'approved' || b.status === 'booked').length;

  const monthlySpend = new Map<string, number>();
  for (const po of activePos) {
    const key = new Date(po.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    monthlySpend.set(key, (monthlySpend.get(key) ?? 0) + po.grand_total);
  }
  const trendData = Array.from(monthlySpend.entries()).map(([month, spend]) => ({ month, spend }));

  const byMethod = new Map<string, number>();
  for (const po of activePos) {
    const label = po.procurement_method.replace(/_/g, ' ');
    byMethod.set(label, (byMethod.get(label) ?? 0) + po.grand_total);
  }
  const methodData = Array.from(byMethod.entries()).map(([name, value]) => ({ name, value }));

  const vendorSpend = new Map<string, ChartPoint>();
  for (const po of activePos) {
    const existing = vendorSpend.get(po.vendor_id);
    vendorSpend.set(po.vendor_id, {
      name: po.vendor_name,
      value: (existing?.value ?? 0) + po.grand_total,
    });
  }
  const topVendors = Array.from(vendorSpend.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const now = Date.now();
  const msmeAlerts = bills
    .filter((b) => b.msme_registered && b.status !== 'on_hold')
    .map((b) => ({
      ...b,
      daysLeft: Math.ceil((new Date(b.payment_due_date).getTime() - now) / 86400000),
    }))
    .filter((b) => b.daysLeft <= 10)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const activity: ActivityItem[] = [
    ...indents.map((i) => ({
      id: i.id,
      type: 'Indent',
      label: i.requested_by_name,
      number: i.indent_number,
      at: i.created_at,
      icon: 'file' as const,
    })),
    ...quotations.map((q) => ({
      id: q.id,
      type: 'RFQ',
      label: `${q.vendor_ids.length} vendors invited`,
      number: q.rfq_number,
      at: q.created_at,
      icon: 'chart' as const,
    })),
    ...pos.map((p) => ({
      id: p.id,
      type: 'PO',
      label: p.vendor_name,
      number: p.po_number,
      at: p.created_at,
      icon: 'server' as const,
    })),
    ...grns.map((g) => ({
      id: g.id,
      type: 'GRN',
      label: g.vendor_name,
      number: g.grn_number,
      at: g.created_at,
      icon: 'box' as const,
    })),
    ...bills.map((b) => ({
      id: b.id,
      type: 'Bill',
      label: b.vendor_name,
      number: b.bill_number,
      at: b.created_at,
      icon: 'wallet' as const,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return {
    totalSpend,
    openIndents,
    pendingQuotations,
    posAwaitingGrn,
    billsPendingApproval,
    activeVendors,
    grnCount: grns.length,
    billsReady,
    trendData,
    methodData,
    topVendors,
    msmeAlerts,
    activity,
  };
}
