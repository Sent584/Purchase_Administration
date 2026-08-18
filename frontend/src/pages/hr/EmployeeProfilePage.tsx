import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { hrApi } from '../../lib/hrApi';
import { EmployeeProfileHeader, EmployeeProfileTabs } from './EmployeeProfileTabs';
import { EmployeeServiceTimeline } from './EmployeeServiceTimeline';

type Tab = 'personal' | 'employment' | 'faculty' | 'statutory';

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('personal');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hr', 'employee', id],
    queryFn: () => hrApi.getEmployee(id!),
    enabled: Boolean(id),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card><CardBody><EmptyState title="Employee not found" description="The record may have been removed." /></CardBody></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-4 text-sm text-ink-500">
        <Link to="/hr/employees" className="text-crimson-700 hover:underline">← Employees</Link>
      </p>
      <EmployeeProfileHeader employee={data} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardBody>
            <EmployeeProfileTabs tab={tab} onChange={setTab} employee={data} />
          </CardBody>
        </Card>
        <EmployeeServiceTimeline employee={data} />
      </div>
    </div>
  );
}
