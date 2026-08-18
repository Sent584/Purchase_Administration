import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../../components/ui/Card';
import { PageSpinner, EmptyState } from '../../components/ui/Feedback';
import { orgApi } from '../../lib/orgApi';
import { OrgTreeView } from './OrgTreeView';
import { buildTree, type NodeKind } from './orgTree';
import { CampusDetail, GroupDetail, InstitutionDetail, UnitDetail } from './DetailPanels';

export function OrgStructurePage() {
  const groupsQuery = useQuery({ queryKey: ['org', 'groups'], queryFn: orgApi.listGroups });
  const institutionsQuery = useQuery({ queryKey: ['org', 'institutions'], queryFn: () => orgApi.listInstitutions() });
  const campusesQuery = useQuery({ queryKey: ['org', 'campuses'], queryFn: () => orgApi.listCampuses() });
  const unitsQuery = useQuery({ queryKey: ['org', 'units'], queryFn: () => orgApi.listOrgUnits() });

  const [selected, setSelected] = useState<{ kind: NodeKind; id: string } | null>(null);

  const loading = groupsQuery.isLoading || institutionsQuery.isLoading || campusesQuery.isLoading || unitsQuery.isLoading;

  const tree = useMemo(() => {
    if (!groupsQuery.data || !institutionsQuery.data || !campusesQuery.data || !unitsQuery.data) return [];
    return buildTree(groupsQuery.data, institutionsQuery.data, campusesQuery.data, unitsQuery.data);
  }, [groupsQuery.data, institutionsQuery.data, campusesQuery.data, unitsQuery.data]);

  if (loading) return <PageSpinner />;

  const selectedGroup = selected?.kind === 'group' ? groupsQuery.data?.find((g) => g.id === selected.id) : undefined;
  const selectedInstitution = selected?.kind === 'institution' ? institutionsQuery.data?.find((i) => i.id === selected.id) : undefined;
  const selectedCampus = selected?.kind === 'campus' ? campusesQuery.data?.find((c) => c.id === selected.id) : undefined;
  const selectedUnit = selected?.kind === 'unit' ? unitsQuery.data?.find((u) => u.id === selected.id) : undefined;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-900">Organisation Structure</h1>
        <p className="text-sm text-ink-500">Group → Institutions → Campuses → Departments / Offices, with full effective status tracking.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardBody className="p-2">
            {tree.length === 0 ? (
              <EmptyState title="No organisation data yet" description="Run the seed script to populate Sasurie sample data." />
            ) : (
              <OrgTreeView nodes={tree} selected={selected} onSelect={(kind, id) => setSelected({ kind, id })} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            {!selected && (
              <EmptyState
                title="Select an item from the tree"
                description="Choose a group, institution, campus or department/office on the left to view and edit its details."
              />
            )}
            {selectedGroup && <GroupDetail group={selectedGroup} />}
            {selectedInstitution && <InstitutionDetail institution={selectedInstitution} />}
            {selectedCampus && <CampusDetail campus={selectedCampus} />}
            {selectedUnit && <UnitDetail unit={selectedUnit} />}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
