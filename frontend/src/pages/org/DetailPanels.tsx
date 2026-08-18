import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { orgApi } from '../../lib/orgApi';
import { apiErrorMessage } from '../../lib/api';
import type { CampusOut, GroupOut, InstitutionOut, OrgUnitOut } from '../../types/api';

function statusTone(status: string) {
  if (status === 'active') return 'success' as const;
  if (status === 'inactive') return 'warning' as const;
  return 'neutral' as const;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value || '—'}</dd>
    </div>
  );
}

function EditToolbar({ editing, onEdit, onCancel, onSave, saving }: { editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void; saving: boolean }) {
  if (!editing) {
    return (
      <Button size="sm" variant="secondary" onClick={onEdit}>
        Edit
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} loading={saving}>
        Save changes
      </Button>
    </div>
  );
}

export function GroupDetail({ group }: { group: GroupOut }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ legal_name: group.legal_name, trade_name: group.trade_name, website: group.website });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => orgApi.updateGroup(group.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'groups'] });
      setEditing(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Group</p>
          <h2 className="text-lg font-semibold text-ink-900">{group.trade_name}</h2>
          <p className="text-sm text-ink-500">{group.org_code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(group.status)}>{group.status}</Badge>
          <EditToolbar editing={editing} onEdit={() => setEditing(true)} onCancel={() => setEditing(false)} onSave={() => mutation.mutate()} saving={mutation.isPending} />
        </div>
      </div>

      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <TextField label="Trade name" value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} />
          <TextField label="Legal name" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
          <TextField label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
      ) : (
        <dl className="mt-4 divide-y divide-ink-100">
          <InfoRow label="Legal name" value={group.legal_name} />
          <InfoRow label="Registration number" value={group.registration_number} />
          <InfoRow label="PAN" value={group.pan} />
          <InfoRow label="TAN" value={group.tan} />
          <InfoRow label="GSTIN(s)" value={group.gstins.join(', ')} />
          <InfoRow label="Website" value={group.website} />
          <InfoRow label="City" value={`${group.address.city}, ${group.address.state}`} />
        </dl>
      )}
    </div>
  );
}

export function InstitutionDetail({ institution }: { institution: InstitutionOut }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: institution.name,
    short_name: institution.short_name,
    principal_name: institution.principal_name,
    university_affiliation: institution.university_affiliation,
    naac_grade: institution.naac_grade,
    website: institution.website,
    autonomous_status: institution.autonomous_status,
    aicte_approved: institution.aicte_approved,
    ugc_recognized: institution.ugc_recognized,
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => orgApi.updateInstitution(institution.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'institutions'] });
      setEditing(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Institution · {institution.code}</p>
          <h2 className="text-lg font-semibold text-ink-900">{institution.name}</h2>
          <p className="text-sm text-ink-500">{institution.university_affiliation}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(institution.status)}>{institution.status}</Badge>
          <EditToolbar editing={editing} onEdit={() => setEditing(true)} onCancel={() => setEditing(false)} onSave={() => mutation.mutate()} saving={mutation.isPending} />
        </div>
      </div>

      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {institution.autonomous_status && <Badge tone="gold">Autonomous</Badge>}
        {institution.aicte_approved && <Badge tone="info">AICTE Approved</Badge>}
        {institution.ugc_recognized && <Badge tone="info">UGC Recognized</Badge>}
        {institution.naac_grade && <Badge tone="success">NAAC {institution.naac_grade}</Badge>}
      </div>

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <TextField label="Institution name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Short name" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
          <TextField label="Principal / Director" value={form.principal_name} onChange={(e) => setForm({ ...form, principal_name: e.target.value })} />
          <TextField label="University affiliation" value={form.university_affiliation} onChange={(e) => setForm({ ...form, university_affiliation: e.target.value })} />
          <TextField label="NAAC grade" value={form.naac_grade} onChange={(e) => setForm({ ...form, naac_grade: e.target.value })} />
          <TextField label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <div className="flex flex-col gap-2 rounded-lg border border-ink-200 p-3">
            {(['autonomous_status', 'aicte_approved', 'ugc_recognized'] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                {key === 'autonomous_status' ? 'Autonomous institution' : key === 'aicte_approved' ? 'AICTE approved' : 'UGC recognized'}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <dl className="mt-4 divide-y divide-ink-100">
          <InfoRow label="Principal / Director" value={institution.principal_name} />
          <InfoRow label="NAAC cycle" value={institution.naac_cycle} />
          <InfoRow label="NBA programmes" value={institution.nba_programmes.join(', ')} />
          <InfoRow label="GSTIN" value={institution.gstin} />
          <InfoRow label="PAN" value={institution.pan} />
          <InfoRow label="Website" value={institution.website} />
          <InfoRow label="Address" value={`${institution.address.city}, ${institution.address.state} ${institution.address.pincode}`} />
        </dl>
      )}
    </div>
  );
}

export function CampusDetail({ campus }: { campus: CampusOut }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: campus.name,
    campus_type: campus.campus_type,
    contacts: { ...campus.contacts },
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => orgApi.updateCampus(campus.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'campuses'] });
      setEditing(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Campus · {campus.code}</p>
          <h2 className="text-lg font-semibold text-ink-900">{campus.name}</h2>
          <p className="text-sm capitalize text-ink-500">{campus.campus_type} campus</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(campus.status)}>{campus.status}</Badge>
          <EditToolbar editing={editing} onEdit={() => setEditing(true)} onCancel={() => setEditing(false)} onSave={() => mutation.mutate()} saving={mutation.isPending} />
        </div>
      </div>

      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <TextField label="Campus name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Campus type" value={form.campus_type} onChange={(e) => setForm({ ...form, campus_type: e.target.value })}>
            <option value="main">Main</option>
            <option value="satellite">Satellite</option>
          </Select>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Functionaries</p>
          {(Object.keys(form.contacts) as (keyof typeof form.contacts)[]).map((key) => (
            <TextField
              key={key}
              label={key.replace(/_/g, ' ')}
              value={form.contacts[key]}
              onChange={(e) => setForm({ ...form, contacts: { ...form.contacts, [key]: e.target.value } })}
            />
          ))}
        </div>
      ) : (
        <>
          <dl className="mt-4 divide-y divide-ink-100">
            <InfoRow label="Address" value={`${campus.address.city}, ${campus.address.state} ${campus.address.pincode}`} />
            <InfoRow label="Working days" value={campus.working_days.join(', ')} />
            <InfoRow label="Geo-fence radius" value={campus.geo_fence_radius_m ? `${campus.geo_fence_radius_m} m` : ''} />
          </dl>
          <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Functionaries</p>
          <dl className="divide-y divide-ink-100">
            <InfoRow label="Campus head" value={campus.contacts.head} />
            <InfoRow label="Admin officer" value={campus.contacts.admin_officer} />
            <InfoRow label="Finance officer" value={campus.contacts.finance_officer} />
            <InfoRow label="HR officer" value={campus.contacts.hr_officer} />
            <InfoRow label="Purchase officer" value={campus.contacts.purchase_officer} />
            <InfoRow label="Stores officer" value={campus.contacts.stores_officer} />
          </dl>
        </>
      )}
    </div>
  );
}

export function UnitDetail({ unit }: { unit: OrgUnitOut }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: unit.name,
    head_name: unit.head_name,
    head_email: unit.head_email ?? '',
    cost_centre_code: unit.cost_centre_code,
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => orgApi.updateOrgUnit(unit.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'units'] });
      setEditing(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            {unit.is_academic ? 'Academic unit' : 'Administrative unit'} · {unit.code}
          </p>
          <h2 className="text-lg font-semibold text-ink-900">{unit.name}</h2>
          <p className="text-sm capitalize text-ink-500">{unit.unit_type.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(unit.status)}>{unit.status}</Badge>
          <EditToolbar editing={editing} onEdit={() => setEditing(true)} onCancel={() => setEditing(false)} onSave={() => mutation.mutate()} saving={mutation.isPending} />
        </div>
      </div>

      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <TextField label="Unit name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Head / in-charge" value={form.head_name} onChange={(e) => setForm({ ...form, head_name: e.target.value })} />
          <TextField label="Head email" type="email" value={form.head_email} onChange={(e) => setForm({ ...form, head_email: e.target.value })} />
          <TextField label="Cost centre code" value={form.cost_centre_code} onChange={(e) => setForm({ ...form, cost_centre_code: e.target.value })} />
        </div>
      ) : (
        <dl className="mt-4 divide-y divide-ink-100">
          <InfoRow label="Head / in-charge" value={unit.head_name} />
          <InfoRow label="Head email" value={unit.head_email ?? ''} />
          <InfoRow label="Cost centre code" value={unit.cost_centre_code} />
          <InfoRow label="Classification" value={unit.is_academic ? 'Academic' : 'Administrative'} />
        </dl>
      )}
    </div>
  );
}
