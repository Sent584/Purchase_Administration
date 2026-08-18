import { Badge } from '../../components/ui/Badge';
import type { EmployeeOut } from '../../types/hr';
import { empStatusTone, formatDate, rankLabel } from './hrHelpers';

type Tab = 'personal' | 'employment' | 'faculty' | 'statutory';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right text-ink-900">{value || '—'}</dd>
    </div>
  );
}

export function EmployeeProfileHeader({ employee }: { employee: EmployeeOut }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{employee.employee_code}</p>
      <h1 className="text-xl font-semibold text-ink-900">{employee.display_name}</h1>
      <p className="text-sm text-ink-500">
        {employee.designation}
        {' · '}
        {[employee.campus_name, employee.division_name, employee.department_name].filter(Boolean).join(' · ') || 'Org TBD'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone={empStatusTone(employee.status)}>{employee.status}</Badge>
        <Badge tone="info">{employee.employee_category.replace(/_/g, ' ')}</Badge>
        <Badge tone="neutral">{employee.employment_type}</Badge>
      </div>
    </div>
  );
}

export function EmployeeProfileTabs({
  tab,
  onChange,
  employee,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  employee: EmployeeOut;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'employment', label: 'Employment' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'statutory', label: 'Statutory / Bank' },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-ink-100 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.id ? 'bg-crimson-50 text-crimson-800' : 'text-ink-600 hover:bg-ink-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <dl className="divide-y divide-ink-100">
        {tab === 'personal' && (
          <>
            <Row label="Title" value={employee.title} />
            <Row label="Gender" value={employee.gender} />
            <Row label="Date of birth" value={formatDate(employee.date_of_birth)} />
            <Row label="Official email" value={employee.official_email} />
            <Row label="Personal email" value={employee.personal_email ?? ''} />
            <Row label="Mobile" value={employee.mobile} />
          </>
        )}
        {tab === 'employment' && (
          <>
            <Row label="Campus" value={employee.campus_name} />
            <Row label="Division" value={employee.division_name} />
            <Row label="Department" value={employee.department_name} />
            <Row label="Designation" value={employee.designation} />
            <Row label="Grade / Pay level" value={`${employee.grade} / ${employee.pay_level}`} />
            <Row label="Date of joining" value={formatDate(employee.date_of_joining)} />
            <Row label="Confirmation" value={formatDate(employee.confirmation_date)} />
            <Row label="Retirement" value={formatDate(employee.retirement_date)} />
            <Row label="Reporting manager" value={employee.reporting_manager_name} />
          </>
        )}
        {tab === 'faculty' && (
          <>
            <Row label="Faculty rank" value={rankLabel(employee.faculty_rank)} />
            <Row label="Doctoral status" value={rankLabel(employee.doctoral_status)} />
            <Row label="Specialisation" value={employee.specialisation} />
            <Row label="Subjects" value={employee.subjects.join(', ')} />
            <Row label="Workload hours" value={employee.workload_hours != null ? String(employee.workload_hours) : ''} />
          </>
        )}
        {tab === 'statutory' && (
          <>
            <Row label="PAN" value={employee.pan} />
            <Row label="UAN" value={employee.uan} />
            <Row label="EPF number" value={employee.epf_number} />
            <Row label="ESI number" value={employee.esi_number} />
            <Row label="Bank" value={employee.bank_name} />
            <Row label="Account number" value={employee.bank_account_number} />
            <Row label="IFSC" value={employee.bank_ifsc} />
          </>
        )}
      </dl>
    </>
  );
}
