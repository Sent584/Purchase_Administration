import type { FeatureItem } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';

export function attendanceWorkflowSteps(pendingRegularisations: number): WorkflowStep[] {
  return [
    { label: 'Punch', description: 'Biometric / geo check-in', status: 'done' },
    {
      label: 'Regularise',
      description: 'Missed punch requests',
      status: pendingRegularisations > 0 ? 'current' : 'done',
      count: pendingRegularisations,
    },
    { label: 'Manager', description: 'Line-manager approval', status: pendingRegularisations > 0 ? 'current' : 'done' },
    { label: 'HR lock', description: 'Period freeze', status: 'upcoming' },
    { label: 'Payroll', description: 'Transfer attendance days', status: 'upcoming' },
  ];
}

export const ATTENDANCE_FEATURES: FeatureItem[] = [
  {
    icon: 'clock',
    title: 'Faculty timetable attendance',
    description: 'Period-wise presence against teaching timetable slots.',
  },
  {
    icon: 'file',
    title: 'On-duty catalogue',
    description: 'OD types for exams, industry visits and official travel.',
  },
  {
    icon: 'wallet',
    title: 'Leave accrual / encashment',
    description: 'Policy-driven accrual, carry-forward and encashment rules.',
  },
  {
    icon: 'mapPin',
    title: 'WFH / geo-fence',
    description: 'Remote punch within configured campus geo-fences.',
  },
];

export const ATTENDANCE_LINKS = [
  { to: '/attendance/daily', label: 'Daily attendance', hint: 'Mark & review presence' },
  { to: '/attendance/leave', label: 'Leave applications', hint: 'Approve pending leave' },
  { to: '/attendance/balances', label: 'Leave balances', hint: 'Accrual & encashment' },
  { to: '/payroll', label: 'Payroll', hint: 'Attendance import feed' },
];
