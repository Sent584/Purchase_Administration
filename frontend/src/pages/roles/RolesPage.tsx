import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Feedback';
import { rbacApi } from '../../lib/rbacApi';

export function RolesPage() {
  const rolesQuery = useQuery({ queryKey: ['rbac', 'roles'], queryFn: rbacApi.listRoles });
  const permissionsQuery = useQuery({ queryKey: ['rbac', 'permissions'], queryFn: rbacApi.listPermissions });

  if (rolesQuery.isLoading || permissionsQuery.isLoading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Roles & Access</h1>
        <p className="text-sm text-ink-500">System roles and the permissions each one grants across the Foundation module.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rolesQuery.data?.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div>
                <CardTitle>{role.name}</CardTitle>
                <p className="text-xs text-ink-500">{role.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {role.is_system_role && <Badge tone="gold">System role</Badge>}
                <Badge tone="neutral">{role.scope_type} scope</Badge>
              </div>
            </CardHeader>
            <CardBody>
              {role.permissions.includes('*') ? (
                <Badge tone="danger">Full unrestricted access (*)</Badge>
              ) : role.permissions.length === 0 ? (
                <p className="text-sm text-ink-400">No elevated permissions — self-service access only.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((code) => (
                    <span key={code} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600" title={permissionsQuery.data?.[code]}>
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
