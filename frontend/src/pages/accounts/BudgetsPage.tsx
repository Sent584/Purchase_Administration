import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero, HeroAction } from '../../components/erp/PageHero';
import { accountsApi } from '../../lib/accountsApi';
import { useAuthStore } from '../../state/authStore';
import type { BudgetOut } from '../../types/accounts';
import { formatInr } from './accountsHelpers';
import { BudgetCommitmentStrip, BudgetFeatureNotes, BudgetRowUtilBar, BudgetUtilisationBars } from './BudgetPanels';

export function BudgetsPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const [selected, setSelected] = useState<BudgetOut | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['accounts', 'budgets', institutionId],
    queryFn: () => accountsApi.budgets(institutionId),
  });

  const columns: DataTableColumn<BudgetOut>[] = [
    { key: 'fy', label: 'FY', render: (b) => <span className="font-mono text-ink-600">{b.fy}</span> },
    {
      key: 'account',
      label: 'Account',
      render: (b) => (
        <div>
          <p className="font-mono text-xs text-ink-500">{b.account_code}</p>
          <p className="text-ink-800">{b.account_name || '—'}</p>
        </div>
      ),
      sortAccessor: (b) => b.account_code,
    },
    { key: 'cc', label: 'Cost Centre', render: (b) => <span className="font-mono">{b.cost_centre_code}</span> },
    { key: 'alloc', label: 'Allocated', render: (b) => formatInr(b.allocated), align: 'right', sortAccessor: (b) => b.allocated },
    { key: 'commit', label: 'Committed', render: (b) => formatInr(b.committed), align: 'right' },
    { key: 'actual', label: 'Actual', render: (b) => formatInr(b.actual), align: 'right' },
    {
      key: 'avail',
      label: 'Available',
      render: (b) => (
        <span className={b.available < 0 ? 'font-semibold text-crimson-700' : 'font-medium text-ink-900'}>
          {formatInr(b.available)}
        </span>
      ),
      align: 'right',
      sortAccessor: (b) => b.available,
    },
    { key: 'util', label: 'Utilisation', render: (b) => <BudgetRowUtilBar budget={b} /> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHero
        eyebrow="Accounts"
        title="Budgets"
        subtitle="Track allocation, commitment and actual spend across cost centres — from pre-commit through payment release."
        actions={<HeroAction to="/accounts">Dashboard</HeroAction>}
      />
      <BudgetCommitmentStrip />
      <BudgetFeatureNotes />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No budgets" description="Budget lines appear after finance seeds the FY plan." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(b) => b.id}
            onRowClick={setSelected}
            selectedRowId={selected?.id}
            searchPlaceholder="Search budgets…"
            searchAccessor={(b) => `${b.fy} ${b.account_code} ${b.account_name} ${b.cost_centre_code}`}
          />
        </Card>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Budget utilisation"
        title={selected?.account_name || selected?.account_code || 'Budget'}
        subtitle={selected ? `${selected.fy} · ${selected.cost_centre_code}` : undefined}
        meta={selected ? [
          { label: 'Allocated', value: formatInr(selected.allocated) },
          { label: 'Committed', value: formatInr(selected.committed) },
          { label: 'Available', value: formatInr(selected.available) },
        ] : undefined}
      >
        {selected && <BudgetUtilisationBars budget={selected} />}
      </Drawer>
    </div>
  );
}
