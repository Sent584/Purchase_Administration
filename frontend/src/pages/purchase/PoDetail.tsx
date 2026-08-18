import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ErrorBanner } from '../../components/ui/Feedback';
import { DocumentDisclaimer, DocumentFooter, DocumentHeader } from '../../components/documents/DocumentLetterhead';
import { DocumentPrintShell } from '../../components/documents/DocumentPrintShell';
import { ApprovalTimeline, type TimelineStep } from '../../components/documents/ApprovalTimeline';
import { poApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { PurchaseOrderOut } from '../../types/purchase';
import { DocumentTaxTotals } from './DocumentTaxTotals';
import { formatInr } from './taxSummary';

export function poStatusTone(status: string) {
  if (status === 'issued') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (status === 'closed') return 'info' as const;
  return 'neutral' as const;
}

function poTimeline(po: PurchaseOrderOut): TimelineStep[] {
  const issued = po.status === 'issued' || po.status === 'closed';
  const cancelled = po.status === 'cancelled';
  return [
    { label: 'Draft created', status: 'done', timestamp: po.created_at },
    {
      label: 'Issued to vendor',
      status: cancelled ? 'rejected' : issued ? 'done' : 'current',
      timestamp: issued ? po.updated_at : null,
    },
  ];
}

export function PoDetail({ po, onChanged }: { po: PurchaseOrderOut; onChanged: () => void }) {
  const canApprove = useAuthStore((s) => s.hasPermission('po:approve'));
  const [error, setError] = useState<string | null>(null);
  const issueMutation = useMutation({ mutationFn: () => poApi.issue(po.id), onSuccess: onChanged, onError: (err) => setError(apiErrorMessage(err)) });
  const cancelMutation = useMutation({
    mutationFn: (reason: string) => poApi.cancel(po.id, reason),
    onSuccess: onChanged,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <DocumentPrintShell documentTitle={`Purchase Order ${po.po_number}`} fileName={po.po_number}>
      <div className="rounded-xl border-2 border-crimson-600/20 bg-white p-5">
        <DocumentHeader
          institutionId={po.institution_id}
          documentTitle="Purchase Order"
          documentNumber={po.po_number}
          documentDate={po.created_at}
          statusNode={<Badge tone={poStatusTone(po.status)}>{po.status}</Badge>}
        />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-ink-400">Vendor</p>
            <p className="font-medium text-ink-900">{po.vendor_name}</p>
            <p className="font-mono text-xs text-ink-500">{po.vendor_gstin}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-400">Place of supply</p>
            <p className="text-ink-800">{po.place_of_supply}</p>
            <p className="text-xs capitalize text-ink-500">{po.procurement_method.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-ink-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-400">
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">HSN</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Taxable</th>
                <th className="px-3 py-2 text-right">GST %</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {po.lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-ink-800">{l.description}</td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-500">{l.hsn_code || '—'}</td>
                  <td className="px-3 py-2 text-right text-ink-600">{l.quantity} {l.uom}</td>
                  <td className="px-3 py-2 text-right text-ink-600">{formatInr(l.rate)}</td>
                  <td className="px-3 py-2 text-right text-ink-700">{formatInr(l.taxable_amount)}</td>
                  <td className="px-3 py-2 text-right text-ink-600">{l.gst_rate}%</td>
                  <td className="px-3 py-2 text-right font-medium text-ink-900">{formatInr(l.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DocumentTaxTotals lines={po.lines} taxableAmount={po.subtotal} grandTotal={po.grand_total} />
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-3 text-xs">
          <div><dt className="text-ink-400">Payment terms</dt><dd className="text-ink-700">{po.payment_terms}</dd></div>
          <div><dt className="text-ink-400">Warranty</dt><dd className="text-ink-700">{po.warranty_terms || '—'}</dd></div>
          <div><dt className="text-ink-400">Penalty clause</dt><dd className="text-ink-700">{po.penalty_clause}</dd></div>
          <div><dt className="text-ink-400">Delivery date</dt><dd className="text-ink-700">{po.delivery_date ? new Date(po.delivery_date).toLocaleDateString('en-IN') : '—'}</dd></div>
        </dl>
        {po.cancellation_reason && <p className="mt-3 text-xs text-red-600">Cancelled: {po.cancellation_reason}</p>}
        <div className="mt-4 border-t border-ink-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Lifecycle</p>
          <ApprovalTimeline steps={poTimeline(po)} />
        </div>
        <DocumentFooter documentType="purchase_order" documentNumber={po.po_number} />
        <DocumentDisclaimer />
      </div>
      </DocumentPrintShell>
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      {canApprove && po.status === 'draft' && (
        <Button className="mt-4 no-print" size="sm" loading={issueMutation.isPending} onClick={() => issueMutation.mutate()}>
          Issue Purchase Order
        </Button>
      )}
      {canApprove && (po.status === 'issued' || po.status === 'draft') && (
        <Button
          className="ml-2 mt-4 no-print"
          size="sm"
          variant="danger"
          loading={cancelMutation.isPending}
          onClick={() => {
            const reason = window.prompt('Reason for cancelling this PO:');
            if (reason) cancelMutation.mutate(reason);
          }}
        >
          Cancel PO
        </Button>
      )}
    </div>
  );
}

