import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Feedback';
import { assetsApi } from '../../lib/assetsApi';
import { formatInr } from './assetHelpers';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right text-ink-900">{value}</dd>
    </div>
  );
}

export function AssetProcurementPanel({ assetId }: { assetId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['assets', 'procurement', assetId],
    queryFn: () => assetsApi.procurement(assetId),
  });

  if (isLoading) return <PageSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">PO details</p>
        <dl className="mt-1 divide-y divide-ink-100 text-sm">
          <Row label="PO number" value={data.po_number || '—'} />
          <Row label="Status" value={data.po_status?.replace(/_/g, ' ') || '—'} />
          <Row label="Grand total" value={data.po_grand_total != null ? formatInr(data.po_grand_total) : '—'} />
          <Row label="Payment terms" value={data.payment_terms || '—'} />
        </dl>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Vendor details</p>
        <dl className="mt-1 divide-y divide-ink-100 text-sm">
          <Row label="Vendor" value={data.vendor_name || data.supplier_name || '—'} />
          <Row label="GSTIN" value={data.vendor_gstin || '—'} />
          <Row label="Category" value={data.vendor_category?.replace(/_/g, ' ') || '—'} />
          <Row label="MSME" value={data.vendor_msme == null ? '—' : data.vendor_msme ? 'Yes' : 'No'} />
        </dl>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Payment status</p>
          <Badge tone={data.payment_status === 'Paid' ? 'success' : data.bill_id ? 'warning' : 'neutral'}>
            {data.payment_status}
          </Badge>
        </div>
        <dl className="mt-1 divide-y divide-ink-100 text-sm">
          <Row label="Bill number" value={data.bill_number || '—'} />
          <Row label="Bill status" value={data.bill_status?.replace(/_/g, ' ') || '—'} />
          <Row label="Net payable" value={data.net_payable != null ? formatInr(data.net_payable) : '—'} />
          <Row label="Due date" value={data.payment_due_date?.slice(0, 10) || '—'} />
        </dl>
      </section>
    </div>
  );
}
