import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { EmptyState, ErrorBanner, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { hrApi } from '../../lib/hrApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { DesignationCreateInput, DesignationOut, EmployeeCategory } from '../../types/hr';

function DesignationForm({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DesignationCreateInput>({
    institution_id: user?.institution_id ?? '',
    name: '',
    code: '',
    category: 'teaching',
    grade: '',
    pay_level: '',
    retirement_age: 60,
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => hrApi.createDesignation(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'designations'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
      <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
      <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EmployeeCategory })}>
        <option value="teaching">Teaching</option>
        <option value="non_teaching">Non-Teaching</option>
      </Select>
      <TextField label="Grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
      <TextField label="Pay level" value={form.pay_level} onChange={(e) => setForm({ ...form, pay_level: e.target.value })} />
      <TextField label="Retirement age" type="number" value={form.retirement_age} onChange={(e) => setForm({ ...form, retirement_age: Number(e.target.value) })} />
      <div className="sm:col-span-2 flex gap-2">
        <Button loading={mutation.isPending} disabled={!form.name || !form.code} onClick={() => mutation.mutate()}>Create designation</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export function DesignationsPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const canWrite = useAuthStore((s) => s.hasPermission('hr:write'));
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['hr', 'designations', institutionId],
    queryFn: () => hrApi.listDesignations(institutionId),
  });

  const columns: DataTableColumn<DesignationOut>[] = [
    { key: 'code', label: 'Code', render: (d) => <span className="font-mono text-ink-600">{d.code}</span>, sortAccessor: (d) => d.code },
    { key: 'name', label: 'Name', render: (d) => <span className="font-medium text-ink-900">{d.name}</span>, sortAccessor: (d) => d.name },
    { key: 'category', label: 'Category', render: (d) => <span className="capitalize">{d.category.replace(/_/g, ' ')}</span> },
    { key: 'grade', label: 'Grade', render: (d) => d.grade || '—' },
    { key: 'pay', label: 'Pay Level', render: (d) => d.pay_level || '—' },
    { key: 'retire', label: 'Retire Age', render: (d) => String(d.retirement_age), align: 'center' },
    { key: 'status', label: 'Status', render: (d) => <Badge tone={d.is_active ? 'success' : 'neutral'}>{d.is_active ? 'active' : 'inactive'}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Designations</h1>
          <p className="text-sm text-ink-500">
            <Link to="/hr" className="text-crimson-700 hover:underline">HR Dashboard</Link>
            {' · '}Teaching and non-teaching designation master.
          </p>
        </div>
        {canWrite && <Button onClick={() => setShowForm(true)}>New Designation</Button>}
      </div>
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No designations yet" description="Create designations used across the employee master." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(d) => d.id}
            searchPlaceholder="Search designations…"
            searchAccessor={(d) => `${d.name} ${d.code} ${d.category}`}
          />
        </Card>
      )}

      <Drawer open={showForm} onClose={() => setShowForm(false)} eyebrow="HR master" title="New Designation" subtitle="Teaching and non-teaching grades">
        <DesignationForm onClose={() => setShowForm(false)} />
      </Drawer>
    </div>
  );
}
