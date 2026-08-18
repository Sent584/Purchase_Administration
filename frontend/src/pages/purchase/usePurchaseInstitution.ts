import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orgApi } from '../../lib/orgApi';
import { useAuthStore } from '../../state/authStore';

/** Resolves institution for purchase create actions (scoped user or picker for group/super admin). */
export function usePurchaseInstitution() {
  const user = useAuthStore((s) => s.user);
  const scopedId = user?.institution_id ?? null;
  const [pickedId, setPickedId] = useState('');

  const { data: institutions = [] } = useQuery({
    queryKey: ['org', 'institutions', user?.group_id],
    queryFn: () => orgApi.listInstitutions(user?.group_id ?? undefined),
    enabled: !scopedId,
  });

  useEffect(() => {
    if (!scopedId && !pickedId && institutions[0]?.id) {
      setPickedId(institutions[0].id);
    }
  }, [scopedId, pickedId, institutions]);

  const institutionId = scopedId || pickedId || '';

  return {
    institutionId,
    setInstitutionId: setPickedId,
    needsInstitutionPicker: !scopedId,
    institutions,
  };
}
