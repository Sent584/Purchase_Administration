import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import type { EmployeeOut } from '../../types/hr';
import { formatDate } from './hrHelpers';

export function EmployeeServiceTimeline({ employee }: { employee: EmployeeOut }) {
  const milestones = [
    { label: 'Joined', date: employee.date_of_joining, icon: 'star' as const, hint: employee.designation },
    { label: 'Confirmed', date: employee.confirmation_date, icon: 'check' as const, hint: employee.employment_type },
    { label: 'Current designation', date: employee.updated_at, icon: 'users' as const, hint: `${employee.designation} · ${employee.grade}` },
    { label: 'Retirement (planned)', date: employee.retirement_date, icon: 'clock' as const, hint: 'Superannuation' },
  ];

  return (
    <Card className="h-fit">
      <CardHeader><CardTitle>Service timeline</CardTitle></CardHeader>
      <CardBody>
        <ol className="flex flex-col">
          {milestones.map((m, idx) => (
            <li key={m.label} className="relative flex gap-3 pb-5 last:pb-0">
              {idx < milestones.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-ink-200" />}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-crimson-50 text-crimson-700">
                <Icon name={m.icon} className="h-4 w-4" />
              </span>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-ink-900">{m.label}</p>
                <p className="text-xs text-ink-500">{m.date ? formatDate(m.date) : 'Not recorded'}</p>
                <p className="mt-0.5 text-xs capitalize text-ink-400">{m.hint.replace(/_/g, ' ')}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
