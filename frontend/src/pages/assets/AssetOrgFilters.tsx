import { Card, CardBody } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';

export function AssetOrgFilters(props: {
  needsInstitutionPicker: boolean;
  institutions: { id: string; name: string }[];
  institutionId: string;
  onInstitution: (id: string) => void;
  campuses: { id: string; name: string }[];
  divisions: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  campusId: string;
  divisionId: string;
  departmentId: string;
  assetClass: string;
  onCampus: (id: string) => void;
  onDivision: (id: string) => void;
  onDepartment: (id: string) => void;
  onAssetClass: (id: string) => void;
  classOptions: { value: string; label: string }[];
}) {
  const p = props;
  return (
    <Card>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {p.needsInstitutionPicker && (
          <Select label="Institution" value={p.institutionId} onChange={(e) => p.onInstitution(e.target.value)}>
            <option value="">Select institution</option>
            {p.institutions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        )}
        <Select label="Campus" value={p.campusId} onChange={(e) => p.onCampus(e.target.value)}>
          <option value="">All campuses</option>
          {p.campuses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select label="Division" value={p.divisionId} disabled={!p.campusId} onChange={(e) => p.onDivision(e.target.value)}>
          <option value="">All divisions</option>
          {p.divisions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <Select label="Department" value={p.departmentId} disabled={!p.campusId} onChange={(e) => p.onDepartment(e.target.value)}>
          <option value="">All departments</option>
          {p.departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <Select label="Class" value={p.assetClass} onChange={(e) => p.onAssetClass(e.target.value)}>
          <option value="">All classes</option>
          {p.classOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </CardBody>
    </Card>
  );
}
