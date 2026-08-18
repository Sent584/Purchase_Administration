import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { ErrorBanner } from '../../components/ui/Feedback';
import { attendanceApi } from '../../lib/attendanceApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import type { LeaveApplicationCreate } from '../../types/attendance';

export function LeaveForm({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const typesQ = useQuery({ queryKey: ['attendance', 'leave-types'], queryFn: () => attendanceApi.leaveTypes() });
  const [form, setForm] = useState<LeaveApplicationCreate>({
    employee_id: '',
    leave_type_code: 'CL',
    from_date: '',
    to_date: '',
    days: 1,
    reason: '',
    substitute_name: '',
    institution_id: user?.institution_id ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await attendanceApi.createLeave(form);
      return attendanceApi.submitLeave(created.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'leave-apps'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Apply for Leave</CardTitle>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
        <TextField label="Employee ID" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required />
        <Select label="Leave type" value={form.leave_type_code} onChange={(e) => setForm({ ...form, leave_type_code: e.target.value })}>
          {(typesQ.data ?? [{ code: 'CL', name: 'Casual Leave' }]).map((t) => (
            <option key={t.code} value={t.code}>{t.code} — {t.name}</option>
          ))}
        </Select>
        <TextField label="From" type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} required />
        <TextField label="To" type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} required />
        <TextField label="Days" type="number" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} />
        <TextField label="Substitute" value={form.substitute_name} onChange={(e) => setForm({ ...form, substitute_name: e.target.value })} />
        <div className="sm:col-span-2">
          <TextField label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Button loading={mutation.isPending} disabled={!form.employee_id || !form.from_date} onClick={() => mutation.mutate()}>
            Submit application
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
