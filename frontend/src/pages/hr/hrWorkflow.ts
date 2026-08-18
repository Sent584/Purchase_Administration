import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';

export const HR_WORKFLOW: WorkflowStep[] = [
  { label: 'Requisition', description: 'Position & vacancy approval', status: 'done' },
  { label: 'Recruitment', description: 'Advertise, shortlist, select', status: 'done' },
  { label: 'Onboarding', description: 'Docs, joining & induction', status: 'current' },
  { label: 'Service book', description: 'Career events & postings', status: 'upcoming' },
  { label: 'Appraisal', description: 'Annual / semester review', status: 'upcoming' },
  { label: 'Separation', description: 'Exit, NOC & full & final', status: 'upcoming' },
];

export const HR_FEATURES: FeatureItem[] = [
  {
    icon: 'users',
    title: 'Employee 360',
    description: 'Single profile spanning postings, leave, payroll and service history.',
  },
  {
    icon: 'chart',
    title: 'Faculty workload',
    description: 'Teaching load, theory/lab hours and department-wise capacity views.',
  },
  {
    icon: 'shield',
    title: 'Masked PAN / Aadhaar / bank',
    description: 'Sensitive IDs shown masked; full values only to privileged roles.',
  },
  {
    icon: 'building',
    title: 'Position control',
    description: 'Sanctioned strength vs filled posts by designation and campus.',
  },
  {
    icon: 'eye',
    title: 'ESS / MSS',
    description: 'Employee and manager self-service for profiles, leave and claims.',
  },
];

export const HR_LINKS = [
  { to: '/hr/employees', label: 'Employees', hint: 'Master list & 360 profiles' },
  { to: '/hr/designations', label: 'Designations', hint: 'Pay levels & position control' },
  { to: '/attendance', label: 'Attendance', hint: 'Presence & leave pipeline' },
  { to: '/payroll', label: 'Payroll', hint: 'Salary runs linked to HR' },
];
