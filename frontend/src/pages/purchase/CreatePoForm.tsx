import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { poApi, quotationApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';

export function CreatePoForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: quotations } = useQuery({
    queryKey: ['purchase', 'quotations', institutionId, 'awarded'],
    queryFn: () => quotationApi.list(institutionId, 'awarded'),
  });
  const { data: orders } = useQuery({
    queryKey: ['purchase', 'orders', institutionId],
    queryFn: () => poApi.list(institutionId),
  });

  const eligible = useMemo(() => {
    const used = new Set((orders ?? []).map((o) => o.quotation_id).filter(Boolean));
    return (quotations ?? []).filter((q) => !used.has(q.id));
  }, [quotations, orders]);

  const [quotationId, setQuotationId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('100% within 30 days of GRN acceptance');
  const [warrantyTerms, setWarrantyTerms] = useState('1 year onsite warranty');
  const [penaltyClause, setPenaltyClause] = useState('0.5% of order value per week of delay, capped at 5%');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      poApi.createFromQuotation(quotationId, {
        delivery_date: deliveryDate || null,
        payment_terms: paymentTerms,
        warranty_terms: warrantyTerms,
        penalty_clause: penaltyClause,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <p className="text-sm text-ink-600">
        Purchase orders are generated from an <span className="font-medium text-ink-800">awarded RFQ</span>. Select one below to create the branded PO.
      </p>
      <Select label="Awarded quotation" value={quotationId} onChange={(e) => setQuotationId(e.target.value)}>
        <option value="">Select awarded RFQ</option>
        {eligible.map((q) => (
          <option key={q.id} value={q.id}>
            {q.rfq_number} · {q.procurement_method.replace(/_/g, ' ')} · {q.vendor_ids.length} vendors
          </option>
        ))}
      </Select>
      {eligible.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No awarded RFQs available without a PO. Award a quotation first from the Quotations module.
        </p>
      )}
      <TextField label="Expected delivery date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
      <TextField label="Payment terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
      <TextField label="Warranty terms" value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} />
      <TextField label="Penalty clause" value={penaltyClause} onChange={(e) => setPenaltyClause(e.target.value)} />
      <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} disabled={!quotationId} onClick={() => mutation.mutate()}>
          Create purchase order
        </Button>
      </div>
    </div>
  );
}
