import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';

export function assetsWorkflowSteps(amcExpiring: number, warrantyExpiring: number): WorkflowStep[] {
  const alerts = amcExpiring + warrantyExpiring;
  return [
    { label: 'Capitalise', description: 'From GRN / invoice', status: 'done' },
    { label: 'Allocate', description: 'Custodian & location', status: 'done' },
    { label: 'Depreciate', description: 'WDV / SLM monthly', status: 'current' },
    { label: 'Transfer', description: 'Campus / dept move', status: 'upcoming' },
    {
      label: 'Verify',
      description: 'Physical & QR scan',
      status: alerts > 0 ? 'current' : 'upcoming',
      count: alerts || undefined,
    },
    { label: 'Dispose', description: 'Write-off & scrap', status: 'upcoming' },
  ];
}

export const ASSETS_FEATURES: FeatureItem[] = [
  {
    icon: 'settings',
    title: 'WDV / SLM Schedule II',
    description: 'Companies Act rates configurable by asset class.',
  },
  {
    icon: 'star',
    title: 'Grant-funded assets',
    description: 'Tagged funding source with utilisation reporting.',
  },
  {
    icon: 'bell',
    title: 'AMC / insurance alerts',
    description: '30-day reminders before AMC and warranty expiry.',
  },
  {
    icon: 'search',
    title: 'QR asset labels',
    description: 'Printable labels for physical verification rounds.',
  },
];

export const ASSETS_LINKS = [
  { to: '/assets/register', label: 'Asset register', hint: 'Full fixed-asset list' },
  { to: '/stores', label: 'Stores', hint: 'Capitalise from GRN' },
  { to: '/accounts', label: 'Accounts', hint: 'Depreciation journals' },
  { to: '/reports', label: 'Reports', hint: 'Class-wise book value' },
];
