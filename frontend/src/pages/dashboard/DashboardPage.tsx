import { useQuery } from '@tanstack/react-query';
import { PageSpinner } from '../../components/ui/Feedback';
import { dashboardApi } from '../../lib/dashboardApi';
import { RoleHomeView } from './RoleHomeView';

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'home'],
    queryFn: () => dashboardApi.home(),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-ink-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-ink-900">Unable to load your role dashboard</p>
        <p className="mt-2 text-xs text-ink-500">Check API connectivity and try again.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-crimson-700 px-4 py-2 text-sm font-medium text-white hover:bg-crimson-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return <RoleHomeView data={data} />;
}
