import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { accountsApi } from '../../lib/accountsApi';
import { useAuthStore } from '../../state/authStore';
import type { AccountOut } from '../../types/accounts';

function typeTone(t: string) {
  if (t === 'asset' || t === 'income') return 'success' as const;
  if (t === 'liability' || t === 'expense') return 'warning' as const;
  return 'info' as const;
}

export function ChartOfAccountsPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const { data, isLoading } = useQuery({
    queryKey: ['accounts', 'coa', institutionId],
    queryFn: () => accountsApi.chartOfAccounts(institutionId),
  });

  const columns: DataTableColumn<AccountOut>[] = [
    { key: 'code', label: 'Code', render: (a) => <span className="font-mono text-ink-600">{a.code}</span>, sortAccessor: (a) => a.code },
    { key: 'name', label: 'Account Name', render: (a) => <span className="font-medium text-ink-900">{a.name}</span>, sortAccessor: (a) => a.name },
    { key: 'type', label: 'Type', render: (a) => <Badge tone={typeTone(a.account_type)}>{a.account_type}</Badge> },
    { key: 'parent', label: 'Parent', render: (a) => a.parent_code ? <span className="font-mono text-ink-500">{a.parent_code}</span> : '—' },
    { key: 'control', label: 'Control', render: (a) => (a.is_control ? 'Yes' : 'No'), align: 'center' },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Chart of Accounts</h1>
        <p className="text-sm text-ink-500">
          <Link to="/accounts" className="text-crimson-700 hover:underline">Dashboard</Link>
          {' · '}Institution ledger structure for Sasurie Group of Institutions.
        </p>
      </div>
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No accounts" description="Seed the chart of accounts to begin voucher posting." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(a) => a.id}
            searchPlaceholder="Search accounts…"
            searchAccessor={(a) => `${a.code} ${a.name} ${a.account_type}`}
            statusOptions={[
              { value: 'asset', label: 'Asset' },
              { value: 'liability', label: 'Liability' },
              { value: 'equity', label: 'Equity' },
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
            statusAccessor={(a) => a.account_type}
          />
        </Card>
      )}
    </div>
  );
}
