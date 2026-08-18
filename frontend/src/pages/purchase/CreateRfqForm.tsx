import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { indentApi, quotationApi, vendorApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import type { ProcurementMethod } from '../../types/purchase';

export function CreateRfqForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: indents } = useQuery({
    queryKey: ['purchase', 'indents', institutionId, 'approved'],
    queryFn: () => indentApi.list(institutionId, 'approved'),
  });
  const { data: vendors } = useQuery({
    queryKey: ['purchase', 'vendors', institutionId],
    queryFn: () => vendorApi.list(institutionId),
  });
  const [indentId, setIndentId] = useState('');
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [method, setMethod] = useState<ProcurementMethod>('limited_quotation');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      quotationApi.create({
        institution_id: institutionId,
        indent_id: indentId,
        vendor_ids: vendorIds,
        procurement_method: method,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'quotations'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function toggleVendor(id: string) {
    setVendorIds((cur) => (cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]));
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}
      <Select label="Approved purchase requisition" value={indentId} onChange={(e) => setIndentId(e.target.value)}>
        <option value="">Select an approved requisition</option>
        {indents?.map((i) => (
          <option key={i.id} value={i.id}>
            {i.indent_number} — {i.requested_by_name} (₹{i.total_estimated_amount.toLocaleString('en-IN')})
          </option>
        ))}
      </Select>
      <Select label="Procurement method" value={method} onChange={(e) => setMethod(e.target.value as ProcurementMethod)}>
        <option value="limited_quotation">Limited quotation (minimum 3 vendors)</option>
        <option value="rate_contract">Rate contract</option>
        <option value="repeat_order">Repeat order</option>
      </Select>
      <div>
        <p className="mb-2 text-sm font-medium text-ink-700">Invite vendors</p>
        <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto rounded-lg border border-ink-200 p-3">
          {vendors
            ?.filter((v) => v.status === 'active')
            .map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={vendorIds.includes(v.id)} onChange={() => toggleVendor(v.id)} />
                {v.trade_name} <span className="text-ink-400">({v.code})</span>
              </label>
            ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={mutation.isPending} disabled={!indentId || vendorIds.length === 0} onClick={() => mutation.mutate()}>
          Create & send RFQ
        </Button>
      </div>
    </div>
  );
}
