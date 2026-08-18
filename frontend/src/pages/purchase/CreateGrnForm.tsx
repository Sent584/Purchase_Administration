import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { grnApi, poApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';

export function CreateGrnForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: pos } = useQuery({
    queryKey: ['purchase', 'orders', institutionId, 'issued'],
    queryFn: () => poApi.list(institutionId, 'issued'),
  });
  const [poId, setPoId] = useState('');
  const { data: po } = useQuery({
    queryKey: ['purchase', 'order', poId],
    queryFn: () => poApi.get(poId),
    enabled: !!poId,
  });

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [lineValues, setLineValues] = useState<
    Record<number, { received: number; accepted: number; rejected: number; reason: string }>
  >({});
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      grnApi.create({
        po_id: poId,
        vendor_invoice_number: invoiceNumber,
        vendor_invoice_date: invoiceDate || null,
        remarks,
        lines: (po?.lines ?? []).map((_, idx) => ({
          line_index: idx,
          received_qty: lineValues[idx]?.received ?? 0,
          accepted_qty: lineValues[idx]?.accepted ?? 0,
          rejected_qty: lineValues[idx]?.rejected ?? 0,
          rejection_reason: lineValues[idx]?.reason ?? '',
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'grns'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'orders'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function patchLine(idx: number, patch: Partial<{ received: number; accepted: number; rejected: number; reason: string }>) {
    setLineValues((cur) => ({
      ...cur,
      [idx]: {
        received: cur[idx]?.received ?? 0,
        accepted: cur[idx]?.accepted ?? 0,
        rejected: cur[idx]?.rejected ?? 0,
        reason: cur[idx]?.reason ?? '',
        ...patch,
      },
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <Select label="Issued purchase order" value={poId} onChange={(e) => setPoId(e.target.value)}>
        <option value="">Select an issued PO</option>
        {pos?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.po_number} — {p.vendor_name}
          </option>
        ))}
      </Select>
      {po && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Vendor invoice number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            <TextField label="Vendor invoice date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Line-wise receipt</p>
            <div className="flex flex-col gap-2">
              {po.lines.map((line, idx) => (
                <div key={idx} className="rounded-lg border border-ink-200 p-3">
                  <p className="mb-2 text-sm font-medium text-ink-800">
                    {line.description}{' '}
                    <span className="text-ink-400">
                      (ordered {line.quantity} {line.uom})
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <TextField
                      label="Received"
                      type="number"
                      value={lineValues[idx]?.received ?? ''}
                      onChange={(e) => {
                        const received = Number(e.target.value);
                        patchLine(idx, { received, accepted: received });
                      }}
                    />
                    <TextField
                      label="Accepted"
                      type="number"
                      value={lineValues[idx]?.accepted ?? ''}
                      onChange={(e) => patchLine(idx, { accepted: Number(e.target.value) })}
                    />
                    <TextField
                      label="Rejected"
                      type="number"
                      value={lineValues[idx]?.rejected ?? ''}
                      onChange={(e) => patchLine(idx, { rejected: Number(e.target.value) })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <TextField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Record GRN
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
