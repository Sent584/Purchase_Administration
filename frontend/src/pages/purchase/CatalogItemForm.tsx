import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { catalogApi, vendorApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import type { ItemCategory, ItemCreateInput } from '../../types/purchase';

const categories: ItemCategory[] = [
  'consumable', 'lab_chemical', 'glassware', 'stationery', 'electrical',
  'it_consumable', 'sports', 'housekeeping', 'medical', 'furniture', 'capital', 'service',
];

const emptyForm = (institutionId: string): ItemCreateInput => ({
  institution_id: institutionId,
  name: '',
  category: 'consumable',
  uom: 'Nos',
  hsn_code: '',
  gst_rate: 18,
  standard_rate: 0,
  specification: '',
  reorder_level: 0,
  is_capital_item: false,
  manufacturer: '',
  model_number: '',
  warranty_months: 0,
  minimum_order_quantity: 1,
  lead_time_days: 15,
  preferred_vendor_ids: [],
});

export { categories };

export function CatalogItemForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: vendors } = useQuery({ queryKey: ['purchase', 'vendors', institutionId], queryFn: () => vendorApi.list(institutionId) });
  const [form, setForm] = useState<ItemCreateInput>(emptyForm(institutionId));
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => catalogApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'catalog'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function togglePreferredVendor(id: string) {
    setForm((f) => ({
      ...f,
      preferred_vendor_ids: f.preferred_vendor_ids.includes(id)
        ? f.preferred_vendor_ids.filter((v) => v !== id)
        : [...f.preferred_vendor_ids, id],
    }));
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
      <TextField label="Item name" className="sm:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })}>
        {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
      </Select>
      <TextField label="Unit of measure" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
      <TextField label="HSN code" value={form.hsn_code} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} />
      <TextField label="GST rate (%)" type="number" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: Number(e.target.value) })} />
      <TextField label="Standard rate (₹)" type="number" value={form.standard_rate} onChange={(e) => setForm({ ...form, standard_rate: Number(e.target.value) })} />
      <TextField label="Reorder level" type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })} />
      <TextField label="Manufacturer / brand" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
      <TextField label="Model number" value={form.model_number} onChange={(e) => setForm({ ...form, model_number: e.target.value })} />
      <TextField label="Specification" className="sm:col-span-2" value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} />
      <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
        <input type="checkbox" checked={form.is_capital_item} onChange={(e) => setForm({ ...form, is_capital_item: e.target.checked })} />
        Capital item (triggers asset creation on receipt)
      </label>
      <div className="sm:col-span-2">
        <p className="mb-2 text-sm font-medium text-ink-700">Preferred vendors</p>
        <div className="flex flex-col gap-1.5 rounded-lg border border-ink-200 p-3">
          {vendors?.filter((v) => v.status === 'active').map((v) => (
            <label key={v.id} className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={form.preferred_vendor_ids.includes(v.id)} onChange={() => togglePreferredVendor(v.id)} />
              {v.trade_name}
            </label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Create item</Button>
      </div>
    </div>
  );
}
