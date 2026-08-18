import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TextField } from '../../components/ui/TextField';
import { EmptyState, ErrorBanner, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { attendanceApi } from '../../lib/attendanceApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { AttendanceOut } from '../../types/attendance';
import { attStatusTone, todayIso } from './attendanceHelpers';

export function DailyAttendancePage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const [onDate, setOnDate] = useState(todayIso());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', 'records', institutionId, onDate],
    queryFn: () => attendanceApi.listRecords(institutionId, onDate),
  });

  const columns: DataTableColumn<AttendanceOut>[] = [
    { key: 'name', label: 'Employee', render: (r) => <span className="font-medium text-ink-900">{r.employee_name}</span>, sortAccessor: (r) => r.employee_name },
    { key: 'shift', label: 'Shift', render: (r) => <span className="font-mono text-ink-600">{r.shift_code}</span> },
    { key: 'in', label: 'In', render: (r) => r.in_time || '—' },
    { key: 'out', label: 'Out', render: (r) => r.out_time || '—' },
    { key: 'late', label: 'Late (min)', render: (r) => String(r.late_minutes), align: 'right' },
    { key: 'source', label: 'Source', render: (r) => <span className="capitalize">{r.source}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={attStatusTone(r.status)}>{r.status.replace(/_/g, ' ')}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Daily Attendance</h1>
          <p className="text-sm text-ink-500">
            <Link to="/attendance" className="text-crimson-700 hover:underline">Dashboard</Link>
            {' · '}Biometric and manual punch records for a selected date.
          </p>
        </div>
        <div className="w-44">
          <TextField label="Date" type="date" value={onDate} onChange={(e) => setOnDate(e.target.value)} />
        </div>
      </div>

      {isError && <div className="mb-4"><ErrorBanner message={apiErrorMessage(error)} /></div>}
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No attendance for this date" description="Records appear after biometric sync or manual entry." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(r) => r.id}
            searchPlaceholder="Search employees…"
            searchAccessor={(r) => `${r.employee_name} ${r.shift_code}`}
            statusOptions={[
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'half_day', label: 'Half day' },
              { value: 'leave', label: 'Leave' },
              { value: 'on_duty', label: 'On duty' },
            ]}
            statusAccessor={(r) => r.status}
          />
        </Card>
      )}
    </div>
  );
}
