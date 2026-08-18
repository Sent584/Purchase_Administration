import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { ErrorBanner } from '../../components/ui/Feedback';
import { vendorApi } from '../../lib/purchaseApi';
import { apiErrorMessage } from '../../lib/api';
import type { VendorOut, VendorRating } from '../../types/purchase';

export function vendorStatusTone(status: string) {
  if (status === 'active') return 'success' as const;
  if (status === 'blacklisted') return 'danger' as const;
  return 'neutral' as const;
}

function RatingInput({ vendor, onSaved }: { vendor: VendorOut; onSaved: () => void }) {
  const [rating, setRating] = useState<VendorRating>(vendor.rating);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => vendorApi.update(vendor.id, { rating }),
    onSuccess: onSaved,
    onError: (err) => setError(apiErrorMessage(err)),
  });
  const fields: { key: keyof Omit<VendorRating, 'overall'>; label: string }[] = [
    { key: 'quality', label: 'Quality' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'price', label: 'Price' },
    { key: 'service', label: 'Service' },
  ];
  return (
    <div className="rounded-lg border border-ink-200 p-3">
      {error && <div className="mb-2"><ErrorBanner message={error} /></div>}
      {fields.map((f) => (
        <div key={f.key} className="mb-2 flex items-center gap-3">
          <span className="w-16 text-xs text-ink-500">{f.label}</span>
          <input type="range" min={0} max={5} step={0.5} value={rating[f.key]} onChange={(e) => setRating({ ...rating, [f.key]: Number(e.target.value) })} className="flex-1 accent-crimson-600" />
          <span className="w-8 text-right text-xs font-medium text-ink-800">{rating[f.key]}</span>
        </div>
      ))}
      <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>Save rating</Button>
    </div>
  );
}

function VendorStatsPanel({ vendorId }: { vendorId: string }) {
  const { data: stats, isLoading } = useQuery({ queryKey: ['purchase', 'vendor-stats', vendorId], queryFn: () => vendorApi.stats(vendorId) });
  if (isLoading || !stats) return <p className="text-sm text-ink-400">Loading performance stats…</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-ink-50 p-3"><p className="text-lg font-semibold text-ink-900">{stats.total_purchase_orders}</p><p className="text-xs text-ink-500">Purchase orders</p></div>
      <div className="rounded-lg bg-ink-50 p-3"><p className="text-lg font-semibold text-ink-900">₹{stats.total_po_value.toLocaleString('en-IN')}</p><p className="text-xs text-ink-500">Total PO value</p></div>
      <div className="rounded-lg bg-ink-50 p-3"><p className="text-lg font-semibold text-ink-900">{stats.on_time_grn_pct}%</p><p className="text-xs text-ink-500">On-time delivery</p></div>
      <div className="rounded-lg bg-ink-50 p-3"><p className="text-lg font-semibold text-ink-900">{stats.quality_acceptance_pct}%</p><p className="text-xs text-ink-500">Quality acceptance</p></div>
    </div>
  );
}

function DocumentForm({ vendor, onSaved }: { vendor: VendorOut; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('gst_certificate');
  const [refNumber, setRefNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => vendorApi.update(vendor.id, {
      documents: [...vendor.documents, { name, doc_type: docType, reference_number: refNumber, issued_date: null, expiry_date: null }],
    }),
    onSuccess: () => { setName(''); setRefNumber(''); onSaved(); },
    onError: (err) => setError(apiErrorMessage(err)),
  });
  return (
    <div className="rounded-lg border border-dashed border-ink-300 p-3">
      {error && <div className="mb-2"><ErrorBanner message={error} /></div>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <TextField label="Document name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select label="Type" value={docType} onChange={(e) => setDocType(e.target.value)}>
          <option value="gst_certificate">GST Certificate</option>
          <option value="pan_card">PAN Card</option>
          <option value="udyam_certificate">Udyam Certificate</option>
          <option value="iso_certificate">ISO Certificate</option>
          <option value="agreement">Agreement / MoU</option>
          <option value="other">Other</option>
        </Select>
        <TextField label="Reference #" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
      </div>
      <Button size="sm" className="mt-2" loading={mutation.isPending} disabled={!name} onClick={() => mutation.mutate()}>+ Add document</Button>
    </div>
  );
}

export function VendorDetail({
  vendor,
  canWrite,
  onSaved,
}: {
  vendor: VendorOut;
  canWrite: boolean;
  onSaved: () => void;
}) {
  const blacklistMutation = useMutation({
    mutationFn: (reason: string) => vendorApi.blacklist(vendor.id, reason),
    onSuccess: onSaved,
  });
  const reinstateMutation = useMutation({
    mutationFn: () => vendorApi.reinstate(vendor.id),
    onSuccess: onSaved,
  });

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={vendorStatusTone(vendor.status)}>{vendor.status}</Badge>
        {vendor.msme_registered && <Badge tone="gold">MSME</Badge>}
        {vendor.quality_certifications.map((c) => <Badge key={c} tone="info">{c}</Badge>)}
      </div>
      {vendor.blacklist_reason && <p className="mt-2 text-xs text-red-600">Blacklist reason: {vendor.blacklist_reason}</p>}
      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Performance</p>
      <VendorStatsPanel vendorId={vendor.id} />
      <dl className="mt-4 divide-y divide-ink-100 text-sm">
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">GSTIN</dt><dd className="font-mono text-ink-900">{vendor.gstin || '—'}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">PAN</dt><dd className="font-mono text-ink-900">{vendor.pan || '—'}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">TDS section</dt><dd className="text-ink-900">{vendor.tds_section}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Credit period</dt><dd className="text-ink-900">{vendor.credit_period_days} days</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Primary contact</dt><dd className="text-right text-ink-900">{vendor.contact_person}<br />{vendor.contact_phone}</dd></div>
        <div className="flex justify-between py-1.5"><dt className="text-ink-500">Bank</dt><dd className="text-right text-ink-900">{vendor.bank_account.bank_name}<br />{vendor.bank_account.account_number}</dd></div>
      </dl>
      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Rate this vendor</p>
      <RatingInput vendor={vendor} onSaved={onSaved} />
      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Documents</p>
      {vendor.documents.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {vendor.documents.map((d, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs">
              <Icon name="paperclip" className="h-3.5 w-3.5 text-ink-400" />
              <span className="flex-1 text-ink-700">{d.name}</span>
              <span className="text-ink-400">{d.reference_number}</span>
            </li>
          ))}
        </ul>
      )}
      {canWrite && <DocumentForm vendor={vendor} onSaved={onSaved} />}
      {canWrite && (
        <div className="mt-4">
          {vendor.status === 'blacklisted' ? (
            <Button size="sm" variant="secondary" loading={reinstateMutation.isPending} onClick={() => reinstateMutation.mutate()}>Reinstate vendor</Button>
          ) : (
            <Button size="sm" variant="danger" loading={blacklistMutation.isPending} onClick={() => {
              const reason = window.prompt('Reason for blacklisting this vendor:');
              if (reason) blacklistMutation.mutate(reason);
            }}>Blacklist vendor</Button>
          )}
        </div>
      )}
    </div>
  );
}
