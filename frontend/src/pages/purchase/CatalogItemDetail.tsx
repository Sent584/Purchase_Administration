import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { vendorApi } from '../../lib/purchaseApi';
import type { ItemOut } from '../../types/purchase';

export function CatalogItemDetail({ item }: { item: ItemOut }) {
  const { data: vendors } = useQuery({
    queryKey: ['purchase', 'vendors', item.institution_id],
    queryFn: () => vendorApi.list(item.institution_id),
  });
  const preferredNames = vendors?.filter((v) => item.preferred_vendor_ids.includes(v.id)).map((v) => v.trade_name) ?? [];

  return (
    <div>
      {item.specification && <p className="text-sm text-ink-600">{item.specification}</p>}
      <dl className="mt-2 divide-y divide-ink-100 text-sm">
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Manufacturer</dt><dd className="text-ink-900">{item.manufacturer || '—'}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Model</dt><dd className="text-ink-900">{item.model_number || '—'}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">HSN code</dt><dd className="font-mono text-ink-900">{item.hsn_code || '—'}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">GST rate</dt><dd className="text-ink-900">{item.gst_rate}%</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Standard rate</dt><dd className="text-ink-900">₹{item.standard_rate.toLocaleString('en-IN')}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Warranty</dt><dd className="text-ink-900">{item.warranty_months ? `${item.warranty_months} months` : '—'}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Min. order qty</dt><dd className="text-ink-900">{item.minimum_order_quantity} {item.uom}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Lead time</dt><dd className="text-ink-900">{item.lead_time_days} days</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Reorder level</dt><dd className="text-ink-900">{item.reorder_level} {item.uom}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Preferred vendors</dt><dd className="text-right text-ink-900">{preferredNames.length ? preferredNames.join(', ') : '—'}</dd></div>
      </dl>
      {item.is_capital_item && <div className="mt-3"><Badge tone="gold">Capital item</Badge></div>}
    </div>
  );
}
