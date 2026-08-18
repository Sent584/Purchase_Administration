import { api } from './api';
import type { CampusOut, GroupOut, InstitutionOut, OrgUnitOut } from '../types/api';

export const orgApi = {
  listGroups: () => api.get<GroupOut[]>('/org/groups').then((r) => r.data),
  listInstitutions: (groupId?: string) =>
    api.get<InstitutionOut[]>('/org/institutions', { params: groupId ? { group_id: groupId } : {} }).then((r) => r.data),
  getInstitution: (id: string) => api.get<InstitutionOut>(`/org/institutions/${id}`).then((r) => r.data),
  getGroup: (id: string) => api.get<GroupOut>(`/org/groups/${id}`).then((r) => r.data),
  listCampuses: (institutionId?: string) =>
    api.get<CampusOut[]>('/org/campuses', { params: institutionId ? { institution_id: institutionId } : {} }).then((r) => r.data),
  listOrgUnits: (campusId?: string) =>
    api.get<OrgUnitOut[]>('/org/units', { params: campusId ? { campus_id: campusId } : {} }).then((r) => r.data),

  updateGroup: (id: string, patch: Partial<GroupOut>) => api.patch<GroupOut>(`/org/groups/${id}`, patch).then((r) => r.data),
  updateInstitution: (id: string, patch: Partial<InstitutionOut>) =>
    api.patch<InstitutionOut>(`/org/institutions/${id}`, patch).then((r) => r.data),
  updateCampus: (id: string, patch: Partial<CampusOut>) => api.patch<CampusOut>(`/org/campuses/${id}`, patch).then((r) => r.data),
  updateOrgUnit: (id: string, patch: Partial<OrgUnitOut>) => api.patch<OrgUnitOut>(`/org/units/${id}`, patch).then((r) => r.data),
};
