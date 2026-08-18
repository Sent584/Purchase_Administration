import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orgApi } from '../../lib/orgApi';

const DEPT_TYPES = new Set(['department', 'office', 'store', 'laboratory']);

export function useOrgScopeOptions(institutionId: string, campusId: string, divisionId: string) {
  const campusesQ = useQuery({
    queryKey: ['org', 'campuses', institutionId],
    queryFn: () => orgApi.listCampuses(institutionId || undefined),
    enabled: Boolean(institutionId),
  });
  const unitsQ = useQuery({
    queryKey: ['org', 'units', campusId],
    queryFn: () => orgApi.listOrgUnits(campusId),
    enabled: Boolean(campusId),
  });

  const divisions = useMemo(
    () => (unitsQ.data ?? []).filter((u) => u.unit_type === 'division'),
    [unitsQ.data],
  );
  const departments = useMemo(
    () =>
      (unitsQ.data ?? [])
        .filter((u) => DEPT_TYPES.has(u.unit_type))
        .filter((u) => !divisionId || u.parent_id === divisionId),
    [unitsQ.data, divisionId],
  );

  return {
    campuses: campusesQ.data ?? [],
    divisions,
    departments,
    isLoading: campusesQ.isLoading || unitsQ.isLoading,
  };
}
