import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { catalogApi } from '../../lib/purchaseApi';
import { stockApi, storesApi } from '../../lib/storesApi';
import { orgApi } from '../../lib/orgApi';
import { apiErrorMessage } from '../../lib/api';
import type { StockTxnCreateInput } from '../../types/stores';

export function StockIssueForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: stores } = useQuery({ queryKey: ['stores', 'list', institutionId], queryFn: () => storesApi.list(institutionId) });
  const { data: items } = useQuery({ queryKey: ['purchase', 'catalog', institutionId], queryFn: () => catalogApi.list(institutionId) });
  const { data: campuses } = useQuery({ queryKey: ['org', 'campuses', institutionId], queryFn: () => orgApi.listCampuses(institutionId) });
  const [campusId, setCampusId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const { data: units } = useQuery({
    queryKey: ['org', 'units', campusId],
    queryFn: () => orgApi.listOrgUnits(campusId),
    enabled: !!campusId,
  });

  const [form, setForm] = useState<StockTxnCreateInput>({
    store_id: '',
    txn_type: 'issue',
    item_id: '',
    quantity: 1,
    uom: 'Nos',
    rate: 0,
    reference_type: '',
    reference_id: '',
    remarks: '',
    to_store_id: null,
    department_id: null,
    issued_to: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      stockApi.post({
        ...form,
        campus_id: campusId || null,
        campus_name: campuses?.find((c) => c.id === campusId)?.name ?? '',
        division_id: divisionId || null,
        division_name: units?.find((u) => u.id === divisionId)?.name ?? '',
        department_id: departmentId || null,
        department_name: units?.find((u) => u.id === departmentId)?.name ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function onItemChange(itemId: string) {
    const item = items?.find((i) => i.id === itemId);
    setForm({ ...form, item_id: itemId, uom: item?.uom ?? 'Nos', rate: item?.standard_rate ?? 0 });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
      <Select label="Campus" value={campusId} onChange={(e) => { setCampusId(e.target.value); setDivisionId(''); setDepartmentId(''); }}>
        <option value="">Select campus</option>
        {campuses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select label="Division" value={divisionId} disabled={!campusId} onChange={(e) => { setDivisionId(e.target.value); setDepartmentId(''); }}>
        <option value="">Select division</option>
        {units?.filter((u) => u.unit_type === 'division').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <Select label="Department" value={departmentId} disabled={!campusId} onChange={(e) => setDepartmentId(e.target.value)}>
        <option value="">Select department</option>
        {units
          ?.filter((u) => u.unit_type === 'department' || u.unit_type === 'office' || u.unit_type === 'store' || u.unit_type === 'laboratory')
          .filter((u) => !divisionId || u.parent_id === divisionId)
          .map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <Select label="Store" value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value })}>
        <option value="">Select store</option>
        {stores?.filter((s) => !campusId || s.campus_id === campusId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <Select label="Item" value={form.item_id} onChange={(e) => onItemChange(e.target.value)}>
        <option value="">Select item</option>
        {items?.map((i) => <option key={i.id} value={i.id}>{i.code} — {i.name}</option>)}
      </Select>
      <TextField label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
      <TextField label="Issued to" value={form.issued_to} onChange={(e) => setForm({ ...form, issued_to: e.target.value })} />
      <TextField label="Remarks" className="sm:col-span-2" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
      <div className="sm:col-span-2 flex justify-end">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.store_id || !form.item_id || form.quantity <= 0 || !campusId}>
          {mutation.isPending ? 'Posting…' : 'Post Issue'}
        </Button>
      </div>
    </div>
  );
}
