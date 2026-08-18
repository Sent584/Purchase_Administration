import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { accountsApi } from '../../lib/accountsApi';
import { useAuthStore } from '../../state/authStore';
import type { TrialBalanceRow } from '../../types/accounts';
import { formatInr } from './accountsHelpers';

export function TrialBalancePage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const { data, isLoading } = useQuery({
    queryKey: ['accounts', 'trial-balance', institutionId],
    queryFn: () => accountsApi.trialBalance(institutionId),
  });

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      debit: rows.reduce((s, r) => s + r.debit, 0),
      credit: rows.reduce((s, r) => s + r.credit, 0),
    };
  }, [data]);

  const columns: DataTableColumn<TrialBalanceRow>[] = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-ink-600">{r.account_code}</span>, sortAccessor: (r) => r.account_code },
    { key: 'name', label: 'Account', render: (r) => <span className="font-medium text-ink-900">{r.account_name}</span>, sortAccessor: (r) => r.account_name },
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize text-ink-600">{r.account_type}</span> },
    { key: 'debit', label: 'Debit', render: (r) => (r.debit ? formatInr(r.debit) : '—'), align: 'right', sortAccessor: (r) => r.debit },
    { key: 'credit', label: 'Credit', render: (r) => (r.credit ? formatInr(r.credit) : '—'), align: 'right', sortAccessor: (r) => r.credit },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Trial Balance</h1>
          <p className="text-sm text-ink-500">
            <Link to="/accounts" className="text-crimson-700 hover:underline">Dashboard</Link>
            {' · '}Debit and credit totals must match for a balanced ledger.
          </p>
        </div>
        {data && data.length > 0 && (
          <div className="rounded-lg bg-gold-100 px-4 py-2 text-sm text-gold-800">
            Debit {formatInr(totals.debit)} · Credit {formatInr(totals.credit)}
            {Math.abs(totals.debit - totals.credit) < 0.01 ? ' · Balanced' : ' · Out of balance'}
          </div>
        )}
      </div>
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No trial balance rows" description="Post vouchers to populate the trial balance." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(r) => r.account_code}
            searchPlaceholder="Search accounts…"
            searchAccessor={(r) => `${r.account_code} ${r.account_name} ${r.account_type}`}
            pageSize={20}
          />
        </Card>
      )}
    </div>
  );
}
