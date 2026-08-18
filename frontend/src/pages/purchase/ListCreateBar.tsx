import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import type { InstitutionOut } from '../../types/api';

/** Always-visible create action; optional institution picker for group/super-admin. */
export function ListCreateBar({
  label,
  onCreate,
  canCreate,
  institutionId,
  institutions,
  needsInstitutionPicker,
  onInstitutionChange,
  hint = 'Create a new document to continue the procure-to-pay workflow.',
}: {
  label: string;
  onCreate: () => void;
  canCreate: boolean;
  institutionId?: string;
  institutions?: InstitutionOut[];
  needsInstitutionPicker?: boolean;
  onInstitutionChange?: (id: string) => void;
  hint?: string;
}) {
  if (!canCreate) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-crimson-200 bg-crimson-50/60 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <p className="text-sm text-ink-700">{hint}</p>
        {needsInstitutionPicker && institutions && onInstitutionChange && (
          <Select
            label="Institution"
            className="min-w-[220px]"
            value={institutionId ?? ''}
            onChange={(e) => onInstitutionChange(e.target.value)}
          >
            <option value="">Select institution</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </Select>
        )}
      </div>
      <Button disabled={!institutionId} onClick={onCreate}>{label}</Button>
    </div>
  );
}
