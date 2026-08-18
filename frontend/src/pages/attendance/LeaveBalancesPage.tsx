import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, ErrorBanner, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { attendanceApi } from '../../lib/attendanceApi';
import { apiErrorMessage } from '../../lib/api';
import type { LeaveBalanceOut } from '../../types/attendance';

export function LeaveBalancesPage() {
  const year = new Date().getFullYear();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', 'leave-balances', year],
    queryFn: () => attendanceApi.leaveBalances(undefined, year),
  });

  const columns: DataTableColumn<LeaveBalanceOut>[] = [
    { key: 'emp', label: 'Employee ID', render: (b) => <span className="font-mono text-ink-600">{b.employee_id}</span>, sortAccessor: (b) => b.employee_id },
    { key: 'type', label: 'Leave Type', render: (b) => <span className="font-mono font-medium text-ink-900">{b.leave_type_code}</span> },
    { key: 'year', label: 'Year', render: (b) => String(b.year), align: 'center' },
    { key: 'opening', label: 'Opening', render: (b) => String(b.opening), align: 'right', sortAccessor: (b) => b.opening },
    { key: 'accrued', label: 'Accrued', render: (b) => String(b.accrued), align: 'right' },
    { key: 'availed', label: 'Availed', render: (b) => String(b.availed), align: 'right' },
    {
      key: 'balance',
      label: 'Balance',
      render: (b) => <span className="font-semibold text-crimson-700">{b.balance}</span>,
      align: 'right',
      sortAccessor: (b) => b.balance,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Leave Balances</h1>
        <p className="text-sm text-ink-500">
          <Link to="/attendance" className="text-crimson-700 hover:underline">Dashboard</Link>
          {' · '}Opening, accrual and available leave for FY {year}.
        </p>
      </div>
      {isError && <div className="mb-4"><ErrorBanner message={apiErrorMessage(error)} /></div>}
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No leave balances" description="Balances are created when leave types are assigned to employees." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(b) => b.id}
            searchPlaceholder="Search by employee or leave type…"
            searchAccessor={(b) => `${b.employee_id} ${b.leave_type_code}`}
          />
        </Card>
      )}
    </div>
  );
}
