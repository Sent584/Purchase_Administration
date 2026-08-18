import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { accountsApi } from '../../lib/accountsApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { VoucherCreateInput, VoucherType } from '../../types/accounts';

export function VoucherForm({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VoucherCreateInput>({
    institution_id: user?.institution_id ?? '',
    voucher_type: 'journal',
    narration: '',
    created_by_name: user?.full_name ?? '',
    lines: [
      { account_code: '', cost_centre: '', debit: 0, credit: 0 },
      { account_code: '', cost_centre: '', debit: 0, credit: 0 },
    ],
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => accountsApi.createVoucher(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', 'vouchers'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function setLine(i: number, patch: Partial<VoucherCreateInput['lines'][0]>) {
    const lines = form.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l));
    setForm({ ...form, lines });
  }

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>New Voucher</CardTitle>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </CardHeader>
      <CardBody className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Type" value={form.voucher_type} onChange={(e) => setForm({ ...form, voucher_type: e.target.value as VoucherType })}>
            <option value="journal">Journal</option>
            <option value="receipt">Receipt</option>
            <option value="payment">Payment</option>
            <option value="contra">Contra</option>
            <option value="purchase">Purchase</option>
            <option value="payroll">Payroll</option>
          </Select>
          <TextField label="Narration" value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} />
        </div>
        {form.lines.map((line, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TextField label={`Account ${i + 1}`} value={line.account_code} onChange={(e) => setLine(i, { account_code: e.target.value })} />
            <TextField label="Cost centre" value={line.cost_centre} onChange={(e) => setLine(i, { cost_centre: e.target.value })} />
            <TextField label="Debit" type="number" value={line.debit} onChange={(e) => setLine(i, { debit: Number(e.target.value) })} />
            <TextField label="Credit" type="number" value={line.credit} onChange={(e) => setLine(i, { credit: Number(e.target.value) })} />
          </div>
        ))}
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Create voucher</Button>
      </CardBody>
    </Card>
  );
}
