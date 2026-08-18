import type { FeatureItem } from '../../components/erp/FeatureCatalogue';

export type ModuleCapability = {
  perm: string;
  to: string;
  icon: 'box' | 'server' | 'users' | 'wallet' | 'chart' | 'clock' | 'cart' | 'building' | 'file';
  label: string;
  valueProp: string;
};

export const MODULE_CAPABILITIES: ModuleCapability[] = [
  {
    perm: 'org:read',
    to: '/org',
    icon: 'building',
    label: 'Organisation',
    valueProp: 'Institutions, campuses and org units',
  },
  {
    perm: 'po:read',
    to: '/purchase',
    icon: 'cart',
    label: 'Purchase',
    valueProp: 'Quotation-based procure-to-pay',
  },
  {
    perm: 'stores:read',
    to: '/stores',
    icon: 'box',
    label: 'Stores',
    valueProp: 'FIFO stock with reorder alerts',
  },
  {
    perm: 'assets:read',
    to: '/assets',
    icon: 'server',
    label: 'Assets',
    valueProp: 'Capitalise, depreciate, verify',
  },
  {
    perm: 'hr:read',
    to: '/hr',
    icon: 'users',
    label: 'HR',
    valueProp: 'Employee 360 & position control',
  },
  {
    perm: 'attendance:read',
    to: '/attendance',
    icon: 'clock',
    label: 'Attendance',
    valueProp: 'Biometric to payroll transfer',
  },
  {
    perm: 'payroll:read',
    to: '/payroll',
    icon: 'wallet',
    label: 'Payroll',
    valueProp: 'UGC pay + statutory compliance',
  },
  {
    perm: 'accounts:read',
    to: '/accounts',
    icon: 'chart',
    label: 'Accounts',
    valueProp: 'Multi-fund GL & budgets',
  },
  {
    perm: 'reports:read',
    to: '/reports',
    icon: 'file',
    label: 'Reports',
    valueProp: 'Cross-module analytics centre',
  },
];

export const EXEC_HIGHLIGHTS: FeatureItem[] = [
  {
    icon: 'shield',
    title: 'Role-based access',
    description: 'Every module gated by fine-grained permissions.',
  },
  {
    icon: 'trendUp',
    title: 'Live operational KPIs',
    description: 'Pipeline counts refresh from the Sasurie database.',
  },
  {
    icon: 'building',
    title: 'Multi-campus ready',
    description: 'Institutions and campuses share one ERP shell.',
  },
];
