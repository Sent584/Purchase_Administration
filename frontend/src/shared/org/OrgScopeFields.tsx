import { Select } from '../../components/ui/Select';
import { useOrgScopeOptions } from './useOrgScopeOptions';

export interface OrgScopeValue {
  campus_id: string;
  division_id: string;
  department_id: string;
}

export function OrgScopeFields({
  institutionId,
  value,
  onChange,
  required = true,
}: {
  institutionId: string;
  value: OrgScopeValue;
  onChange: (next: OrgScopeValue & { department_name?: string; campus_name?: string; division_name?: string }) => void;
  required?: boolean;
}) {
  const { campuses, divisions, departments } = useOrgScopeOptions(
    institutionId,
    value.campus_id,
    value.division_id,
  );

  return (
    <>
      <Select
        label="Campus"
        value={value.campus_id}
        required={required}
        onChange={(e) =>
          onChange({
            campus_id: e.target.value,
            division_id: '',
            department_id: '',
            campus_name: campuses.find((c) => c.id === e.target.value)?.name,
            division_name: '',
            department_name: '',
          })
        }
      >
        <option value="">Select campus</option>
        {campuses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>
      <Select
        label="Division"
        value={value.division_id}
        required={required}
        disabled={!value.campus_id}
        onChange={(e) =>
          onChange({
            ...value,
            division_id: e.target.value,
            department_id: '',
            division_name: divisions.find((d) => d.id === e.target.value)?.name,
            department_name: '',
          })
        }
      >
        <option value="">Select division</option>
        {divisions.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>
      <Select
        label="Department"
        value={value.department_id}
        required={required}
        disabled={!value.campus_id}
        onChange={(e) => {
          const dept = departments.find((d) => d.id === e.target.value);
          onChange({
            ...value,
            department_id: e.target.value,
            department_name: dept?.name ?? '',
          });
        }}
      >
        <option value="">Select department</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>
    </>
  );
}
