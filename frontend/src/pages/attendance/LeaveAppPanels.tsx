import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ErrorBanner } from '../../components/ui/Feedback';
import { ApprovalTimeline, type TimelineStep } from '../../components/documents/ApprovalTimeline';
import { FeatureCatalogue } from '../../components/erp/FeatureCatalogue';
import type { WorkflowStep } from '../../components/erp/WorkflowStrip';
import type { LeaveApplicationOut, LeaveAppStatus } from '../../types/attendance';
import { formatDate, leaveStatusTone } from './attendanceHelpers';

export function leaveWorkflowSteps(status: LeaveAppStatus | null): WorkflowStep[] {
  const labels = [
    { label: 'Draft', description: 'Capture dates' },
    { label: 'Submit', description: 'Staff applies' },
    { label: 'Manager', description: 'Reporting officer' },
    { label: 'HR', description: 'Policy check' },
    { label: 'Joining report', description: 'Return to duty' },
  ];
  let idx = 1;
  if (status === 'draft') idx = 0;
  else if (status === 'submitted') idx = 2;
  else if (status === 'approved') idx = 4;
  else if (status === 'rejected') idx = 2;
  return labels.map((l, i) => ({
    ...l,
    status: status === 'rejected' && i === 2 ? 'current' : i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  }));
}

export function leaveTimeline(app: LeaveApplicationOut): TimelineStep[] {
  const rejected = app.status === 'rejected';
  return [
    { label: 'Draft / created', status: 'done', timestamp: app.created_at },
    { label: 'Submitted', status: app.status === 'draft' ? 'pending' : 'done' },
    {
      label: 'Manager review',
      status: app.status === 'submitted' ? 'current' : app.status === 'approved' ? 'done' : rejected ? 'rejected' : 'pending',
      actor: app.approver_name || null,
    },
    { label: 'HR confirmation', status: app.status === 'approved' ? 'done' : 'pending' },
    {
      label: 'Joining report',
      status: app.status === 'approved' ? 'current' : 'pending',
      notes: app.status === 'approved' ? 'Expected on return date' : null,
    },
  ];
}

export function LeaveFeatureNotes() {
  return (
    <FeatureCatalogue
      title="Leave policy notes"
      items={[
        { icon: 'users', title: 'Substitute acceptance', description: 'Named substitute must accept class/duty coverage before long leave is finally approved.' },
        { icon: 'clock', title: 'Prefix / suffix', description: 'Holidays and week-offs adjoining leave may prefix or suffix the sanctioned days per policy.' },
        { icon: 'alert', title: 'Clubbing rules', description: 'CL cannot usually be clubbed with EL beyond allowed limits; medical leave needs documents when flagged.' },
      ]}
    />
  );
}

export function LeaveDetailPanel({
  selected,
  actionError,
  canApprove,
  approvePending,
  rejectPending,
  onApprove,
  onReject,
}: {
  selected: LeaveApplicationOut;
  actionError: string | null;
  canApprove: boolean;
  approvePending: boolean;
  rejectPending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="h-fit">
      <CardHeader><CardTitle>{selected.leave_type_code}</CardTitle></CardHeader>
      <CardBody className="space-y-4 text-sm">
        {actionError && <ErrorBanner message={actionError} />}
        <p className="font-medium text-ink-900">{selected.days} day(s)</p>
        <p className="text-ink-600">{formatDate(selected.from_date)} → {formatDate(selected.to_date)}</p>
        <p className="text-ink-500">{selected.reason || 'No reason given'}</p>
        {selected.substitute_name && <p className="text-xs text-ink-500">Substitute: {selected.substitute_name}</p>}
        <Badge tone={leaveStatusTone(selected.status)}>{selected.status}</Badge>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Approval timeline</p>
          <ApprovalTimeline steps={leaveTimeline(selected)} />
        </div>
        {canApprove && selected.status === 'submitted' && (
          <div className="flex gap-2 border-t border-ink-100 pt-3">
            <Button size="sm" loading={approvePending} onClick={onApprove}>Approve</Button>
            <Button size="sm" variant="ghost" loading={rejectPending} onClick={onReject}>Reject</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
