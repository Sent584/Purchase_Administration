import type { CampusOut, GroupOut, InstitutionOut, OrgUnitOut } from '../../types/api';

export type NodeKind = 'group' | 'institution' | 'campus' | 'unit';

export interface TreeNode {
  kind: NodeKind;
  id: string;
  label: string;
  sub?: string;
  children: TreeNode[];
}

export function buildTree(groups: GroupOut[], institutions: InstitutionOut[], campuses: CampusOut[], units: OrgUnitOut[]): TreeNode[] {
  function unitChildren(campusId: string, parentId: string | null): TreeNode[] {
    return units
      .filter((u) => u.campus_id === campusId && u.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => ({
        kind: 'unit' as const,
        id: u.id,
        label: u.name,
        sub: u.unit_type,
        children: unitChildren(campusId, u.id),
      }));
  }

  return groups.map((g) => ({
    kind: 'group' as const,
    id: g.id,
    label: g.trade_name,
    sub: g.org_code,
    children: institutions
      .filter((i) => i.group_id === g.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((inst) => ({
        kind: 'institution' as const,
        id: inst.id,
        label: inst.short_name,
        sub: inst.name,
        children: campuses
          .filter((c) => c.institution_id === inst.id)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => ({
            kind: 'campus' as const,
            id: c.id,
            label: c.name,
            sub: c.campus_type,
            children: unitChildren(c.id, null),
          })),
      })),
  }));
}
