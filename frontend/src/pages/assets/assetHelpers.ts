import type { AssetClass, FundingSource } from '../../types/assets';

export const ASSET_CLASS_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: 'land', label: 'Land' },
  { value: 'building', label: 'Building' },
  { value: 'plant_machinery', label: 'Plant & Machinery' },
  { value: 'lab_equipment', label: 'Lab Equipment' },
  { value: 'computers', label: 'Computers' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'library_books', label: 'Library Books' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'sports', label: 'Sports' },
];

export const FUNDING_OPTIONS: { value: FundingSource; label: string }[] = [
  { value: 'institution', label: 'Institution' },
  { value: 'grant', label: 'Grant' },
  { value: 'project', label: 'Project' },
  { value: 'donation', label: 'Donation' },
];

export function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function assetStatusTone(status: string) {
  if (status === 'active') return 'success' as const;
  if (status === 'under_repair') return 'warning' as const;
  if (status === 'disposed' || status === 'written_off') return 'danger' as const;
  return 'neutral' as const;
}

export function classLabel(value: string): string {
  return ASSET_CLASS_OPTIONS.find((o) => o.value === value)?.label ?? value.replace(/_/g, ' ');
}
