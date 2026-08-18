import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { ErrorBanner } from '../../components/ui/Feedback';
import { DocumentDisclaimer, DocumentFooter, DocumentHeader } from '../../components/documents/DocumentLetterhead';
import { DocumentPrintShell } from '../../components/documents/DocumentPrintShell';
import { ApprovalTimeline, type TimelineStep } from '../../components/documents/ApprovalTimeline';
import { billApi, grnApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { PurchaseBillOut } from '../../types/purchase';
import { DocumentTaxTotals } from './DocumentTaxTotals';
import { formatInr } from './taxSummary';

export function billStatusTone(status: string) {
  if (status === 'approved') return 'success' as const;
  if (status === 'on_hold') return 'warning' as const;
  return 'neutral' as const;
}

function buildBillTimeline(bill: PurchaseBillOut): TimelineStep[] {
  return [
    { label: 'Bill booked (three-way matched)', status: 'done', timestamp: bill.created_at },
    {
      label: bill.status === 'on_hold' ? 'On hold' : 'Approved for payment',
      status: bill.status === 'booked' ? 'current' : bill.status === 'on_hold' ? 'rejected' : 'done',
      actor: bill.approved_by,
      timestamp: bill.approved_at,
      notes: bill.approver_notes,
    },
  ];
}

export function BillForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: grns } = useQuery({ queryKey: ['purchase', 'grns', institutionId], queryFn: () => grnApi.list(institutionId) });
  const { data: existingBills } = useQuery({ queryKey: ['purchase', 'bills', institutionId], queryFn: () => billApi.list(institutionId) });
  const unbilledGrns = grns?.filter((g) => !existingBills?.some((b) => b.grn_id === g.id));
  const [grnId, setGrnId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => billApi.create({ grn_id: grnId, vendor_invoice_number: invoiceNumber, vendor_invoice_date: invoiceDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'bills'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <p className="text-xs text-ink-500">
        Amounts come from GRN accepted qty × PO rates — three-way match by construction.
      </p>
      <Select label="GRN" value={grnId} onChange={(e) => setGrnId(e.target.value)}>
        <option value="">Select a GRN not yet billed</option>
        {unbilledGrns?.map((g) => (
          <option key={g.id} value={g.id}>{g.grn_number} — {g.po_number} ({g.vendor_name})</option>
        ))}
      </Select>
      <TextField label="Vendor invoice number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
      <TextField label="Vendor invoice date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
      <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} disabled={!grnId || !invoiceNumber || !invoiceDate} onClick={() => mutation.mutate()}>
          Book bill
        </Button>
      </div>
    </div>
  );
}

export function BillDetail({ bill, onChanged }: { bill: PurchaseBillOut; onChanged: () => void }) {
  const canApprove = useAuthStore((s) => s.hasPermission('bill:approve'));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const approveMutation = useMutation({
    mutationFn: () => billApi.approve(bill.id, notes),
    onSuccess: onChanged,
    onError: (err) => setError(apiErrorMessage(err)),
  });
  const holdMutation = useMutation({
    mutationFn: () => billApi.hold(bill.id, notes),
    onSuccess: onChanged,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <DocumentPrintShell documentTitle={`Purchase Bill ${bill.bill_number}`} fileName={bill.bill_number}>
      <div className="rounded-xl border border-ink-200 bg-white p-4">
        <DocumentHeader
          institutionId={bill.institution_id}
          documentTitle="Purchase Bill / Invoice"
          documentNumber={bill.bill_number}
          documentDate={bill.created_at}
          statusNode={<Badge tone={billStatusTone(bill.status)}>{bill.status.replace(/_/g, ' ')}</Badge>}
        />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-ink-400">Vendor</p>
            <p className="font-medium text-ink-900">{bill.vendor_name}</p>
            <p className="font-mono text-xs text-ink-500">{bill.vendor_gstin}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-400">Invoice {bill.vendor_invoice_number}</p>
            <p className="text-ink-800">PO {bill.po_number}</p>
            <p className="text-xs text-ink-500">GRN {bill.grn_number}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={bill.three_way_match_status === 'matched' ? 'success' : 'danger'}>
            Three-way match: {bill.three_way_match_status}
          </Badge>
          {bill.msme_registered && <Badge tone="gold">MSME — 45 day window</Badge>}
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-ink-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-400">
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Taxable</th>
                <th className="px-3 py-2 text-right">GST %</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {bill.lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-ink-800">{l.description}</td>
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

        <DocumentTaxTotals
          lines={bill.lines}
          taxableAmount={bill.taxable_amount}
          grandTotal={bill.net_payable}
          grandLabel="Net payable"
          extraRows={[
            { label: 'Gross', amount: bill.gross_amount },
            { label: `TDS (${bill.tds_section} @ ${bill.tds_rate}%)`, amount: bill.tds_amount, tone: 'danger' },
          ]}
        />
        <DocumentFooter documentType="purchase_bill" documentNumber={bill.bill_number} approvedBy={bill.approved_by} />
        <DocumentDisclaimer />
      </div>
      </DocumentPrintShell>
      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Approval Timeline</p>
      <ApprovalTimeline steps={buildBillTimeline(bill)} />
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      {bill.status === 'booked' && canApprove && (
        <div className="mt-4 flex flex-col gap-2 no-print">
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>Approve for payment</Button>
            <Button size="sm" variant="danger" loading={holdMutation.isPending} onClick={() => holdMutation.mutate()}>Hold</Button>
          </div>
        </div>
      )}
    </div>
  );
}
