import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { assetsApi } from '../../lib/assetsApi';
import { apiErrorMessage } from '../../lib/api';
import { OrgScopeFields } from '../../shared/org/OrgScopeFields';
import type { AssetCreateInput, AssetClass, FundingSource } from '../../types/assets';
import { ASSET_CLASS_OPTIONS, FUNDING_OPTIONS } from './assetHelpers';

function empty(institutionId: string): AssetCreateInput {
  return {
    institution_id: institutionId,
    campus_id: '',
    division_id: '',
    department_id: '',
    asset_class: 'computers',
    name: '',
    description: '',
    make: '',
    model: '',
    serial_number: '',
    capitalization_date: null,
    capitalization_value: 0,
    funding_source: 'institution',
    supplier_name: '',
    warranty_expiry: null,
    amc_expiry: null,
    custodian_name: '',
    location_building: '',
    location_floor: '',
    location_room: '',
    useful_life_years: 5,
    depreciation_method: 'wdv',
    depreciation_rate: 15,
    residual_value: 0,
  };
}

export function AssetCreateForm({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => empty(institutionId));
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      assetsApi.create({
        ...form,
        institution_id: institutionId,
        division_id: form.division_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const canSubmit = form.name && form.campus_id && form.department_id;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
      <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OrgScopeFields
          institutionId={institutionId}
          value={{
            campus_id: form.campus_id,
            division_id: form.division_id ?? '',
            department_id: form.department_id,
          }}
          onChange={(org) =>
            setForm({
              ...form,
              campus_id: org.campus_id,
              division_id: org.division_id,
              department_id: org.department_id,
            })
          }
        />
      </div>
      <TextField label="Asset name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Select label="Class" value={form.asset_class} onChange={(e) => setForm({ ...form, asset_class: e.target.value as AssetClass })}>
        {ASSET_CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <TextField label="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
      <TextField label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
      <TextField label="Serial number" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
      <TextField label="Capitalization value (₹)" type="number" value={form.capitalization_value} onChange={(e) => setForm({ ...form, capitalization_value: Number(e.target.value) })} />
      <Select label="Funding source" value={form.funding_source} onChange={(e) => setForm({ ...form, funding_source: e.target.value as FundingSource })}>
        {FUNDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <TextField label="Supplier" value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
      <TextField label="Custodian" value={form.custodian_name} onChange={(e) => setForm({ ...form, custodian_name: e.target.value })} />
      <TextField label="Building" value={form.location_building} onChange={(e) => setForm({ ...form, location_building: e.target.value })} />
      <TextField label="Floor" value={form.location_floor} onChange={(e) => setForm({ ...form, location_floor: e.target.value })} />
      <TextField label="Room" value={form.location_room} onChange={(e) => setForm({ ...form, location_room: e.target.value })} />
      <div className="sm:col-span-2">
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()} disabled={!canSubmit}>
          Register asset
        </Button>
      </div>
    </div>
  );
}
