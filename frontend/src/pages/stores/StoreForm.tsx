import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { storesApi } from '../../lib/storesApi';
import { orgApi } from '../../lib/orgApi';
import { apiErrorMessage } from '../../lib/api';
import type { StoreCreateInput, StoreType } from '../../types/stores';

const storeTypes: StoreType[] = ['central', 'department', 'laboratory', 'hostel', 'sports', 'maintenance'];

export function StoreForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: campuses } = useQuery({
    queryKey: ['org', 'campuses', institutionId],
    queryFn: () => orgApi.listCampuses(institutionId),
  });
  const [form, setForm] = useState<StoreCreateInput>({
    institution_id: institutionId,
    campus_id: '',
    code: '',
    name: '',
    store_type: 'central',
    location: '',
    in_charge_name: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => storesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
      <Select label="Campus" value={form.campus_id} onChange={(e) => setForm({ ...form, campus_id: e.target.value })}>
        <option value="">Select campus</option>
        {campuses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select label="Store type" value={form.store_type} onChange={(e) => setForm({ ...form, store_type: e.target.value as StoreType })}>
        {storeTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
      </Select>
      <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
      <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <TextField label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <TextField label="In-charge" value={form.in_charge_name} onChange={(e) => setForm({ ...form, in_charge_name: e.target.value })} />
      <div className="sm:col-span-2 flex justify-end">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.campus_id || !form.code || !form.name}>
          {mutation.isPending ? 'Saving…' : 'Create Store'}
        </Button>
      </div>
    </div>
  );
}
