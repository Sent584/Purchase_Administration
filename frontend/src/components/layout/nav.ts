export interface NavItem {
  label: string;
  path?: string;
  icon: string;
  permission?: string;
  comingSoon?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: 'grid' },
      { label: 'Command Centre', path: '/executive', icon: 'shield', permission: 'reports:read' },
      { label: 'Approvals', path: '/executive/approvals', icon: 'file', permission: 'reports:read' },
      { label: 'Student Fees', path: '/fees', icon: 'wallet', permission: 'reports:read' },
      { label: 'Reports & Analytics', path: '/reports', icon: 'file', permission: 'reports:read' },
    ],
  },
  {
    title: 'Foundation',
    items: [
      { label: 'Organisation Structure', path: '/org', icon: 'building', permission: 'org:read' },
      { label: 'Global Configuration', path: '/config', icon: 'settings', permission: 'config:read' },
      { label: 'Roles & Access', path: '/roles', icon: 'shield', permission: 'role:read' },
    ],
  },
  {
    title: 'Purchase & Procurement',
    items: [
      { label: 'Overview', path: '/purchase', icon: 'chart', permission: 'vendor:read' },
      { label: 'Vendors', path: '/purchase/vendors', icon: 'cart', permission: 'vendor:read' },
      { label: 'Item Catalog', path: '/purchase/catalog', icon: 'box', permission: 'catalog:read' },
      { label: 'Purchase Requisitions', path: '/purchase/requisitions', icon: 'file', permission: 'indent:read' },
      { label: 'Quotations', path: '/purchase/quotations', icon: 'chart', permission: 'quotation:read' },
      { label: 'Purchase Orders', path: '/purchase/orders', icon: 'server', permission: 'po:read' },
      { label: 'Goods Receipt (GRN)', path: '/purchase/grn', icon: 'box', permission: 'grn:read' },
      { label: 'Purchase Bills', path: '/purchase/bills', icon: 'wallet', permission: 'bill:read' },
    ],
  },
  {
    title: 'Stores & Inventory',
    items: [
      { label: 'Overview', path: '/stores', icon: 'chart', permission: 'stores:read' },
      { label: 'Stores', path: '/stores/list', icon: 'building', permission: 'stores:read' },
      { label: 'Stock Ledger', path: '/stores/stock', icon: 'box', permission: 'stores:read' },
      { label: 'Issues & Movements', path: '/stores/issues', icon: 'file', permission: 'stores:read' },
    ],
  },
  {
    title: 'Assets',
    items: [
      { label: 'Overview', path: '/assets', icon: 'chart', permission: 'assets:read' },
      { label: 'Asset Register', path: '/assets/register', icon: 'server', permission: 'assets:read' },
    ],
  },
  {
    title: 'Human Resources',
    items: [
      { label: 'Overview', path: '/hr', icon: 'chart', permission: 'hr:read' },
      { label: 'Employees', path: '/hr/employees', icon: 'users', permission: 'hr:read' },
      { label: 'Designations', path: '/hr/designations', icon: 'shield', permission: 'hr:read' },
    ],
  },
  {
    title: 'Attendance & Leave',
    items: [
      { label: 'Overview', path: '/attendance', icon: 'chart', permission: 'attendance:read' },
      { label: 'Daily Attendance', path: '/attendance/daily', icon: 'clock', permission: 'attendance:read' },
      { label: 'Leave Applications', path: '/attendance/leave', icon: 'file', permission: 'leave:read' },
      { label: 'Leave Balances', path: '/attendance/balances', icon: 'wallet', permission: 'leave:read' },
    ],
  },
  {
    title: 'Payroll',
    items: [
      { label: 'Overview', path: '/payroll', icon: 'chart', permission: 'payroll:read' },
      { label: 'Payroll Runs', path: '/payroll/runs', icon: 'clock', permission: 'payroll:read' },
      { label: 'Payslips', path: '/payroll/payslips', icon: 'wallet', permission: 'payroll:read' },
    ],
  },
  {
    title: 'Accounts & Finance',
    items: [
      { label: 'Overview', path: '/accounts', icon: 'chart', permission: 'accounts:read' },
      { label: 'Student Fees', path: '/fees', icon: 'wallet', permission: 'accounts:read' },
      { label: 'Chart of Accounts', path: '/accounts/coa', icon: 'file', permission: 'accounts:read' },
      { label: 'Vouchers', path: '/accounts/vouchers', icon: 'wallet', permission: 'accounts:read' },
      { label: 'Budgets', path: '/accounts/budgets', icon: 'trendUp', permission: 'budget:read' },
      { label: 'Trial Balance', path: '/accounts/trial-balance', icon: 'chart', permission: 'accounts:read' },
    ],
  },
];
