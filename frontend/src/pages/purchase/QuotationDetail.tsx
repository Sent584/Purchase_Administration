import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { ErrorBanner } from '../../components/ui/Feedback';
import { Icon } from '../../components/ui/Icon';
import { DocumentPrintShell } from '../../components/documents/DocumentPrintShell';
import { poApi, quotationApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { QuotationOut } from '../../types/purchase';
import { RecordQuoteForm } from './RecordQuoteForm';

export function quotationStatusTone(status: string) {
  if (status === 'awarded') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (status === 'quotes_received') return 'info' as const;
  return 'neutral' as const;
}

export function QuotationL1Panel({ quotation }: { quotation: QuotationOut }) {
  const { data: comparative } = useQuery({
    queryKey: ['purchase', 'comparative', quotation.id, quotation.quotes.length],
    queryFn: () => quotationApi.comparative(quotation.id),
    enabled: quotation.quotes.length > 0,
  });
  const l1 = comparative?.rows.find((r) => r.is_l1);

  return (
    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="flex items-start gap-2">
        <Icon name="star" className="mt-0.5 h-4 w-4 text-emerald-700" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">Comparative / L1 workflow</p>
          <p className="mt-0.5 text-xs text-emerald-800">
            Landed cost ranks vendors automatically. Award defaults to L1; non-L1 awards require written justification.
          </p>
          {l1 ? (
            <p className="mt-2 text-sm font-medium text-emerald-900">
              Current L1: {l1.vendor_name} · ₹{l1.landed_cost.toLocaleString('en-IN')} · {l1.delivery_days}d
            </p>
          ) : (
            <p className="mt-2 text-xs text-emerald-700">Record quotes to compute the comparative statement.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuotationDetail({ quotation, onChanged }: { quotation: QuotationOut; onChanged: () => void }) {
  const navigate = useNavigate();
  const canAward = useAuthStore((s) => s.hasPermission('quotation:award'));
  const canWritePo = useAuthStore((s) => s.hasPermission('po:write'));
  const { data: comparative } = useQuery({
    queryKey: ['purchase', 'comparative', quotation.id, quotation.quotes.length],
    queryFn: () => quotationApi.comparative(quotation.id),
    enabled: quotation.quotes.length > 0,
  });
  const { data: existingPos } = useQuery({
    queryKey: ['purchase', 'orders', quotation.institution_id],
    queryFn: () => poApi.list(quotation.institution_id),
    enabled: quotation.status === 'awarded',
  });
  const existingPo = existingPos?.find((po) => po.quotation_id === quotation.id);
  const [awardVendor, setAwardVendor] = useState('');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [poResult, setPoResult] = useState<string | null>(null);

  const awardMutation = useMutation({
    mutationFn: () => quotationApi.award(quotation.id, awardVendor, justification),
    onSuccess: onChanged,
    onError: (err) => setError(apiErrorMessage(err)),
  });
  const generatePoMutation = useMutation({
    mutationFn: () => poApi.createFromQuotation(quotation.id, {
      delivery_date: null,
      payment_terms: '100% within 30 days of GRN acceptance',
      warranty_terms: '1 year onsite warranty',
      penalty_clause: '0.5% of order value per week of delay, capped at 5%',
    }),
    onSuccess: (po) => setPoResult(po.po_number),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <DocumentPrintShell documentTitle={`RFQ ${quotation.rfq_number}`} fileName={quotation.rfq_number}>
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <QuotationL1Panel quotation={quotation} />
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{quotation.rfq_number}</p>
          <div className="mt-1 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-ink-900">{quotation.vendor_ids.length} vendors invited</h3>
            <Badge tone={quotationStatusTone(quotation.status)}>{quotation.status.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-sm capitalize text-ink-500">{quotation.procurement_method.replace(/_/g, ' ')}</p>
          {comparative && comparative.rows.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Comparative Statement</p>
              <div className="overflow-x-auto rounded-lg border border-ink-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-400">
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2">Landed Cost</th>
                      <th className="px-3 py-2">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {comparative.rows.map((row) => (
                      <tr key={row.vendor_id} className={row.is_l1 ? 'bg-emerald-50/50' : ''}>
                        <td className="px-3 py-2 text-ink-600">{row.rank} {row.is_l1 && <Badge tone="success">L1</Badge>}</td>
                        <td className="px-3 py-2 font-medium text-ink-900">{row.vendor_name}</td>
                        <td className="px-3 py-2 text-ink-900">₹{row.landed_cost.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-ink-600">{row.delivery_days} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DocumentPrintShell>
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      {(quotation.status === 'rfq_sent' || quotation.status === 'quotes_received') && (
        <div className="no-print mt-4">
          <RecordQuoteForm quotation={quotation} onRecorded={onChanged} />
        </div>
      )}
      {quotation.status === 'quotes_received' && canAward && comparative && (
        <div className="no-print mt-4 rounded-lg border border-dashed border-ink-300 p-4">
          <p className="mb-2 text-sm font-medium text-ink-800">Award this RFQ</p>
          <Select label="Award to vendor" value={awardVendor} onChange={(e) => setAwardVendor(e.target.value)}>
            <option value="">Select vendor</option>
            {comparative.rows.map((r) => <option key={r.vendor_id} value={r.vendor_id}>{r.vendor_name} {r.is_l1 ? '(L1)' : ''}</option>)}
          </Select>
          {awardVendor && awardVendor !== comparative.l1_vendor_id && (
            <TextField className="mt-2" label="Justification for non-L1 award (required)" value={justification} onChange={(e) => setJustification(e.target.value)} />
          )}
          <Button className="mt-2" size="sm" loading={awardMutation.isPending} disabled={!awardVendor} onClick={() => awardMutation.mutate()}>Award</Button>
        </div>
      )}
      {quotation.status === 'awarded' && (
        <div className="no-print mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">Awarded — ready to generate a purchase order.</p>
          {quotation.award_justification && <p className="mt-1 text-xs text-emerald-700">Justification: {quotation.award_justification}</p>}
          {poResult || existingPo ? (
            <p className="mt-2 text-sm font-medium text-emerald-800">
              Purchase order {poResult ?? existingPo?.po_number} already generated.{' '}
              <button type="button" className="underline" onClick={() => navigate('/purchase/orders')}>View purchase orders →</button>
            </p>
          ) : (
            canWritePo && (
              <Button className="mt-2" size="sm" loading={generatePoMutation.isPending} onClick={() => generatePoMutation.mutate()}>
                Generate Purchase Order
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
