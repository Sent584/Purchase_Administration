import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { PageSpinner, ErrorBanner } from '../../components/ui/Feedback';
import { formatInr } from '../../components/erp/FeatureCatalogue';
import { feesApi } from '../../lib/feesApi';
import { apiErrorMessage } from '../../lib/api';

function tone(bucket: string): 'danger' | 'warning' | 'success' | 'neutral' {
  if (bucket === 'Overdue') return 'danger';
  if (bucket.includes('30')) return 'warning';
  if (bucket.includes('90')) return 'neutral';
  return 'success';
}

export function FeesStudentDetailDrawer({
  studentId,
  onClose,
}: {
  studentId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fees', 'student', studentId],
    queryFn: () => feesApi.student(studentId!),
    enabled: Boolean(studentId),
  });

  return (
    <Drawer
      open={Boolean(studentId)}
      onClose={onClose}
      eyebrow="Student fee ledger"
      title={data?.student_name ?? 'Student fees'}
      subtitle={data ? `${data.student_id} · ${data.programme}` : undefined}
      meta={
        data
          ? [
              { label: 'Campus', value: data.campus },
              { label: 'Department', value: data.department },
              { label: 'Batch', value: data.batch },
              { label: 'Pending', value: formatInr(data.pending_amount) },
            ]
          : undefined
      }
    >
      {isLoading && <PageSpinner />}
      {isError && <ErrorBanner message={apiErrorMessage(error)} />}
      {data && (
        <div className="space-y-3">
          <p className="text-sm text-ink-600">
            {data.division} · {data.year} · {data.lines.length} pending fee heads
          </p>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="py-2 font-semibold">Fee head</th>
                <th className="py-2 font-semibold">Due</th>
                <th className="py-2 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr key={`${line.type_name}-${line.due_date}`} className="border-b border-ink-50 last:border-0">
                  <td className="py-2.5">
                    <p className="font-medium text-ink-900">{line.type_name}</p>
                    <p className="text-xs text-ink-500">{line.category}</p>
                  </td>
                  <td className="py-2.5">
                    <p className="text-ink-700">{line.due_date}</p>
                    <Badge tone={tone(line.due_bucket)}>{line.due_bucket}</Badge>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-crimson-800">{formatInr(line.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Drawer>
  );
}
