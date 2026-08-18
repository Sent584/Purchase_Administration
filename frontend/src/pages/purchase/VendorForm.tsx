import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { vendorApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import type { VendorCreateInput } from '../../types/purchase';

const emptyForm = (institutionId: string): VendorCreateInput => ({
  institution_id: institutionId,
  legal_name: '',
  trade_name: '',
  vendor_category: 'goods',
  gst_registration_type: 'regular',
  gstin: '',
  pan: '',
  msme_registered: false,
  udyam_number: '',
  tds_section: '194Q',
  address: { line1: '', line2: '', city: '', state: 'Tamil Nadu', pincode: '', country: 'India' },
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  secondary_contact_person: '',
  secondary_contact_phone: '',
  credit_period_days: 30,
  delivery_lead_time_days: 15,
  quality_certifications: [],
  bank_account: { account_holder: '', account_number: '', ifsc_code: '', bank_name: '', branch: '' },
  product_categories: [],
});

export function VendorForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VendorCreateInput>(emptyForm(institutionId));
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => vendorApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', 'vendors'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 sm:col-span-2">Identity</p>
      <TextField label="Trade name" value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} required />
      <TextField label="Legal name" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} required />
      <Select label="Category" value={form.vendor_category} onChange={(e) => setForm({ ...form, vendor_category: e.target.value as VendorCreateInput['vendor_category'] })}>
        <option value="goods">Goods</option>
        <option value="services">Services</option>
        <option value="works">Works</option>
        <option value="annual_maintenance">Annual Maintenance Contract</option>
      </Select>
      <TextField
        label="Product/service categories (comma separated)"
        value={form.product_categories.join(', ')}
        onChange={(e) => setForm({ ...form, product_categories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 sm:col-span-2">Statutory &amp; Tax</p>
      <Select label="GST registration type" value={form.gst_registration_type} onChange={(e) => setForm({ ...form, gst_registration_type: e.target.value as VendorCreateInput['gst_registration_type'] })}>
        <option value="regular">Regular</option>
        <option value="composition">Composition</option>
        <option value="unregistered">Unregistered</option>
      </Select>
      <TextField label="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
      <TextField label="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
      <Select label="TDS section" value={form.tds_section} onChange={(e) => setForm({ ...form, tds_section: e.target.value as VendorCreateInput['tds_section'] })}>
        <option value="none">None</option>
        <option value="194C">194C — Contractors</option>
        <option value="194J">194J — Professional/Technical services</option>
        <option value="194I">194I — Rent</option>
        <option value="194Q">194Q — Purchase of goods</option>
      </Select>
      <TextField label="Udyam registration number" value={form.udyam_number} onChange={(e) => setForm({ ...form, udyam_number: e.target.value })} />
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-700">
        <input type="checkbox" checked={form.msme_registered} onChange={(e) => setForm({ ...form, msme_registered: e.target.checked })} />
        MSME / Udyam registered
      </label>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 sm:col-span-2">Commercial &amp; Contacts</p>
      <TextField label="Credit period (days)" type="number" value={form.credit_period_days} onChange={(e) => setForm({ ...form, credit_period_days: Number(e.target.value) })} />
      <TextField label="Delivery lead time (days)" type="number" value={form.delivery_lead_time_days} onChange={(e) => setForm({ ...form, delivery_lead_time_days: Number(e.target.value) })} />
      <TextField label="Primary contact" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
      <TextField label="Primary phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
      <TextField label="Primary email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
      <TextField label="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
      <TextField label="Bank name" value={form.bank_account.bank_name} onChange={(e) => setForm({ ...form, bank_account: { ...form.bank_account, bank_name: e.target.value } })} />
      <TextField label="Account number" value={form.bank_account.account_number} onChange={(e) => setForm({ ...form, bank_account: { ...form.bank_account, account_number: e.target.value } })} />
      <div className="sm:col-span-2">
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Create vendor</Button>
      </div>
    </div>
  );
}
