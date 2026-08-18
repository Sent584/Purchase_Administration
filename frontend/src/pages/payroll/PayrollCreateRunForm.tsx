import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { ErrorBanner } from '../../components/ui/Feedback';
import { payrollApi } from '../../lib/payrollApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';

export function PayrollCreateRunForm({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      payrollApi.createRun({
        period_year: year,
        period_month: month,
        institution_id: user?.institution_id ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>New Payroll Run</CardTitle>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {error && <div className="sm:col-span-3"><ErrorBanner message={error} /></div>}
        <TextField label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <TextField label="Month (1–12)" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        <div className="flex items-end">
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Create run</Button>
        </div>
      </CardBody>
    </Card>
  );
}
