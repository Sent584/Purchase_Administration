import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { hrApi } from '../../lib/hrApi';
import { useAuthStore } from '../../state/authStore';
import { useOrgScopeOptions } from '../../shared/org/useOrgScopeOptions';
import type { EmployeeOut } from '../../types/hr';
import { usePurchaseInstitution } from '../purchase/usePurchaseInstitution';
import { EmployeeCreateForm } from './EmployeeCreateForm';
import { EmployeeOrgFilters } from './EmployeeOrgFilters';
import { empStatusTone } from './hrHelpers';

export function EmployeesPage() {
  const canWrite = useAuthStore((s) => s.hasPermission('hr:write'));
  const { institutionId, setInstitutionId, needsInstitutionPicker, institutions } = usePurchaseInstitution();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [campusId, setCampusId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const { campuses, divisions, departments } = useOrgScopeOptions(institutionId, campusId, divisionId);

  const { data, isLoading } = useQuery({
    queryKey: ['hr', 'employees', institutionId, category, campusId, divisionId, departmentId],
    queryFn: () =>
      hrApi.listEmployees({
        institution_id: institutionId || undefined,
        category: category || undefined,
        campus_id: campusId || undefined,
        division_id: divisionId || undefined,
        department_id: departmentId || undefined,
      }),
  });

  const chips = useMemo(() => {
    const rows = data ?? [];
    return {
      total: rows.length,
      teaching: rows.filter((e) => e.employee_category === 'teaching').length,
      nonTeaching: rows.filter((e) => e.employee_category === 'non_teaching').length,
      probation: rows.filter((e) => e.employment_type === 'probation').length,
    };
  }, [data]);

  const columns: DataTableColumn<EmployeeOut>[] = [
    { key: 'code', label: 'Code', render: (e) => <span className="font-mono text-ink-600">{e.employee_code}</span>, sortAccessor: (e) => e.employee_code },
    {
      key: 'name',
      label: 'Name',
      render: (e) => (
        <Link to={`/hr/employees/${e.id}`} className="font-medium text-crimson-700 hover:underline">{e.display_name}</Link>
      ),
      sortAccessor: (e) => e.display_name,
    },
    { key: 'designation', label: 'Designation', render: (e) => e.designation },
    { key: 'campus', label: 'Campus', render: (e) => e.campus_name || '—' },
    { key: 'division', label: 'Division', render: (e) => e.division_name || '—' },
    { key: 'dept', label: 'Department', render: (e) => e.department_name || '—' },
    { key: 'category', label: 'Category', render: (e) => <span className="capitalize">{e.employee_category.replace(/_/g, ' ')}</span> },
    { key: 'status', label: 'Status', render: (e) => <Badge tone={empStatusTone(e.status)}>{e.status}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHero
        eyebrow="Employee 360°"
        title="Employee Master"
        subtitle="Maintain staff against campus, division and department — same org scope as Purchase and Stores."
        actions={
          <>
            <HeroAction to="/hr">HR dashboard</HeroAction>
            {canWrite && (
              <Button
                className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
                disabled={!institutionId}
                onClick={() => setShowForm(true)}
              >
                New Employee
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon="users" label="In view" value={String(chips.total)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile icon="users" label="Teaching" value={String(chips.teaching)} tone="bg-sky-50 text-sky-700" />
        <KpiTile icon="users" label="Non-teaching" value={String(chips.nonTeaching)} tone="bg-gold-100 text-gold-700" />
        <KpiTile icon="clock" label="On probation" value={String(chips.probation)} tone="bg-amber-50 text-amber-700" />
      </div>

      <EmployeeOrgFilters
        needsInstitutionPicker={needsInstitutionPicker}
        institutions={institutions}
        institutionId={institutionId}
        onInstitution={(id) => { setInstitutionId(id); setCampusId(''); setDivisionId(''); setDepartmentId(''); }}
        campuses={campuses}
        divisions={divisions}
        departments={departments}
        campusId={campusId}
        divisionId={divisionId}
        departmentId={departmentId}
        category={category}
        onCampus={(id) => { setCampusId(id); setDivisionId(''); setDepartmentId(''); }}
        onDivision={(id) => { setDivisionId(id); setDepartmentId(''); }}
        onDepartment={setDepartmentId}
        onCategory={setCategory}
      />

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.length === 0 ? (
        <Card><CardBody><EmptyState title="No employees yet" description="Create the first employee with campus, division and department." /></CardBody></Card>
      ) : (
        <Card>
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(e) => e.id}
            searchPlaceholder="Search by name, code, email, designation, org…"
            searchAccessor={(e) =>
              `${e.display_name} ${e.employee_code} ${e.official_email} ${e.designation} ${e.campus_name} ${e.division_name} ${e.department_name}`
            }
            statusOptions={[
              { value: 'active', label: 'Active' },
              { value: 'on_leave', label: 'On leave' },
              { value: 'relieved', label: 'Relieved' },
              { value: 'retired', label: 'Retired' },
            ]}
            statusAccessor={(e) => e.status}
          />
        </Card>
      )}

      <Drawer
        open={showForm && !!institutionId}
        onClose={() => setShowForm(false)}
        eyebrow="Employee master"
        title="New Employee"
        subtitle="Assign campus, division and department"
      >
        {institutionId && <EmployeeCreateForm institutionId={institutionId} onClose={() => setShowForm(false)} />}
      </Drawer>
    </div>
  );
}
