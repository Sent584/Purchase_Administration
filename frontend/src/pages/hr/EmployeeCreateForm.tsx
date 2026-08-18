import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { hrApi } from '../../lib/hrApi';
import { apiErrorMessage } from '../../lib/api';
import { OrgScopeFields } from '../../shared/org/OrgScopeFields';
import type { EmployeeCategory, EmployeeCreateInput, EmploymentType } from '../../types/hr';

function emptyForm(institutionId: string): EmployeeCreateInput {
  return {
    institution_id: institutionId,
    campus_id: '',
    division_id: '',
    department_id: '',
    department_name: '',
    title: 'Mr.',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    official_email: '',
    mobile: '',
    employee_category: 'teaching',
    employment_type: 'permanent',
    designation: '',
    designation_code: '',
    grade: '',
    pay_level: '',
    date_of_joining: null,
    pan: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    faculty_rank: null,
    doctoral_status: null,
    specialisation: '',
    subjects: [],
    workload_hours: null,
  };
}

export function EmployeeCreateForm({
  institutionId,
  onClose,
}: {
  institutionId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => emptyForm(institutionId));
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      hrApi.createEmployee({
        ...form,
        institution_id: institutionId,
        division_id: form.division_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const canSubmit =
    form.first_name &&
    form.last_name &&
    form.official_email &&
    form.designation &&
    form.campus_id &&
    form.department_id;

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
              department_name: org.department_name ?? form.department_name,
            })
          }
        />
      </div>
      <TextField label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
      <TextField label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
      <TextField label="Official email" type="email" value={form.official_email} onChange={(e) => setForm({ ...form, official_email: e.target.value })} required />
      <TextField label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
      <Select label="Category" value={form.employee_category} onChange={(e) => setForm({ ...form, employee_category: e.target.value as EmployeeCategory })}>
        <option value="teaching">Teaching</option>
        <option value="non_teaching">Non-Teaching</option>
      </Select>
      <Select label="Employment type" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value as EmploymentType })}>
        <option value="permanent">Permanent</option>
        <option value="probation">Probation</option>
        <option value="contract">Contract</option>
        <option value="visiting">Visiting</option>
        <option value="adjunct">Adjunct</option>
      </Select>
      <TextField label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
      <TextField label="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
      <div className="sm:col-span-2 flex gap-2">
        <Button loading={mutation.isPending} disabled={!canSubmit} onClick={() => mutation.mutate()}>
          Create employee
        </Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
