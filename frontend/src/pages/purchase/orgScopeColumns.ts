import type { OrgScopeFields } from '../../types/purchase';
import type { DataTableColumn } from '../../components/ui/DataTable';

export function orgScopeColumns<T extends OrgScopeFields>(): DataTableColumn<T>[] {
  return [
    {
      key: 'campus',
      label: 'Campus',
      render: (r) => r.campus_name || '—',
      sortAccessor: (r) => r.campus_name || '',
    },
    {
      key: 'division',
      label: 'Division',
      render: (r) => r.division_name || '—',
      sortAccessor: (r) => r.division_name || '',
    },
    {
      key: 'department',
      label: 'Department',
      render: (r) => r.department_name || '—',
      sortAccessor: (r) => r.department_name || '',
    },
  ];
}

export function orgScopeSearchText(r: OrgScopeFields): string {
  return `${r.campus_name} ${r.division_name} ${r.department_name}`;
}
