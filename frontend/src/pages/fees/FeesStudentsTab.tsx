import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { PageSpinner, ErrorBanner } from '../../components/ui/Feedback';
import { formatInr } from '../../components/erp/FeatureCatalogue';
import { feesApi, type StudentFeeFilters } from '../../lib/feesApi';
import { apiErrorMessage } from '../../lib/api';
import type { FeesOverview } from '../../types/fees';

export function FeesStudentsTab({
  overview,
  filters,
  setFilters,
  onSelectStudent,
}: {
  overview: FeesOverview;
  filters: StudentFeeFilters;
  setFilters: (f: StudentFeeFilters) => void;
  onSelectStudent: (id: string) => void;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fees', 'students', filters],
    queryFn: () => feesApi.students(filters),
  });

  const patch = (partial: StudentFeeFilters) => setFilters({ ...filters, ...partial });

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <TextField
            label="Search"
            placeholder="Name or roll no."
            value={filters.search ?? ''}
            onChange={(e) => patch({ search: e.target.value || undefined })}
          />
          <Select label="Campus" value={filters.campus ?? ''} onChange={(e) => patch({ campus: e.target.value || undefined })}>
            <option value="">All campuses</option>
            {overview.by_campus.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </Select>
          <Select label="Division" value={filters.division ?? ''} onChange={(e) => patch({ division: e.target.value || undefined })}>
            <option value="">All divisions</option>
            {overview.by_division.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </Select>
          <Select label="Department" value={filters.department ?? ''} onChange={(e) => patch({ department: e.target.value || undefined })}>
            <option value="">All departments</option>
            {overview.by_department.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </Select>
          <Select label="Batch" value={filters.batch ?? ''} onChange={(e) => patch({ batch: e.target.value || undefined })}>
            <option value="">All batches</option>
            {overview.by_batch.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </Select>
        </CardBody>
      </Card>

      {(filters.campus || filters.division || filters.department || filters.batch || filters.search) && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setFilters({})}>Clear filters</Button>
          {filters.campus && <Badge tone="gold">Campus: {filters.campus}</Badge>}
          {filters.division && <Badge tone="info">Division: {filters.division}</Badge>}
          {filters.department && <Badge tone="neutral">Dept: {filters.department}</Badge>}
          {filters.batch && <Badge tone="warning">Batch: {filters.batch}</Badge>}
        </div>
      )}

      {isLoading && <PageSpinner />}
      {isError && <ErrorBanner message={apiErrorMessage(error)} />}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>{data.length} students with pending dues</CardTitle>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Org</th>
                  <th className="px-4 py-3 font-semibold">Batch / Year</th>
                  <th className="px-4 py-3 font-semibold text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((s) => (
                  <tr
                    key={s.student_id}
                    className="cursor-pointer border-b border-ink-50 last:border-0 hover:bg-crimson-50/40"
                    onClick={() => onSelectStudent(s.student_id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{s.student_name}</p>
                      <p className="text-xs text-ink-500">{s.student_id}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      <p className="text-xs">{s.campus}</p>
                      <p className="text-xs text-ink-500">{s.department}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      <p>{s.batch}</p>
                      <p className="text-xs text-ink-500">{s.year} · {s.line_count} lines</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-crimson-800">{formatInr(s.pending_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 100 && (
              <p className="px-4 py-3 text-xs text-ink-500">Showing top 100 of {data.length}. Refine filters to narrow results.</p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
