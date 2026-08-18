import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { quotationApi, vendorApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import type { QuotationOut } from '../../types/purchase';

export function RecordQuoteForm({ quotation, onRecorded }: { quotation: QuotationOut; onRecorded: () => void }) {
  const { data: vendors } = useQuery({ queryKey: ['purchase', 'vendors', quotation.institution_id], queryFn: () => vendorApi.list(quotation.institution_id) });
  const pendingVendorIds = quotation.vendor_ids.filter((id) => !quotation.quotes.some((q) => q.vendor_id === id));
  const [vendorId, setVendorId] = useState('');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [freight, setFreight] = useState(0);
  const [installation, setInstallation] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState(15);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      quotationApi.recordQuote(quotation.id, {
        vendor_id: vendorId,
        lines: quotation.lines.map((l) => ({ description: l.description, rate: rates[l.description] ?? 0, gst_rate: 18 })),
        freight,
        installation,
        other_charges: otherCharges,
        delivery_days: deliveryDays,
        remarks,
      }),
    onSuccess: () => { setVendorId(''); setRates({}); onRecorded(); },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (pendingVendorIds.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-dashed border-ink-300 p-4">
      <p className="mb-3 text-sm font-medium text-ink-800">Record a vendor quote</p>
      {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
      <Select label="Vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
        <option value="">Select vendor</option>
        {pendingVendorIds.map((id) => {
          const v = vendors?.find((x) => x.id === id);
          return <option key={id} value={id}>{v?.trade_name ?? id}</option>;
        })}
      </Select>
      {vendorId && (
        <div className="mt-3 flex flex-col gap-2">
          {quotation.lines.map((l) => (
            <TextField
              key={l.description}
              label={`Rate for: ${l.description}`}
              type="number"
              value={rates[l.description] ?? ''}
              onChange={(e) => setRates({ ...rates, [l.description]: Number(e.target.value) })}
            />
          ))}
          <div className="grid grid-cols-3 gap-2">
            <TextField label="Freight" type="number" value={freight} onChange={(e) => setFreight(Number(e.target.value))} />
            <TextField label="Installation" type="number" value={installation} onChange={(e) => setInstallation(Number(e.target.value))} />
            <TextField label="Other charges" type="number" value={otherCharges} onChange={(e) => setOtherCharges(Number(e.target.value))} />
          </div>
          <TextField label="Delivery (days)" type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(Number(e.target.value))} />
          <TextField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>Save quote</Button>
        </div>
      )}
    </div>
  );
}
