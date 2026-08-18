import { useQuery } from '@tanstack/react-query';
import { PageSpinner, ErrorBanner } from '../../components/ui/Feedback';
import { PageHero, HeroAction, KpiTile } from '../../components/erp/PageHero';
import { WorkflowStrip } from '../../components/erp/WorkflowStrip';
import { FeatureCatalogue, ExceptionPanel, QuickLinks } from '../../components/erp/FeatureCatalogue';
import { attendanceApi } from '../../lib/attendanceApi';
import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../state/authStore';
import { ATTENDANCE_FEATURES, ATTENDANCE_LINKS, attendanceWorkflowSteps } from './attendanceWorkflow';

export function AttendanceDashboardPage() {
  const institutionId = useAuthStore((s) => s.user?.institution_id ?? undefined);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', 'dashboard', institutionId],
    queryFn: () => attendanceApi.dashboard(institutionId),
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <ErrorBanner message={apiErrorMessage(error)} />;

  const presentRate =
    data.present_today + data.absent_today + data.on_leave_today > 0
      ? Math.round(
          (data.present_today / (data.present_today + data.absent_today + data.on_leave_today)) * 100,
        )
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        eyebrow="People operations"
        title="Attendance & Leave"
        subtitle="Biometric and geo punches flow through regularisation and HR lock into payroll — with faculty timetable and on-duty support."
        actions={
          <>
            <HeroAction to="/attendance/daily">Daily register</HeroAction>
            <HeroAction to="/attendance/leave">Leave desk</HeroAction>
          </>
        }
      />

      <WorkflowStrip title="Attendance → payroll path" steps={attendanceWorkflowSteps(data.pending_regularisations)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiTile icon="check" label="Present Today" value={String(data.present_today)} tone="bg-emerald-50 text-emerald-700" />
        <KpiTile icon="alert" label="Absent Today" value={String(data.absent_today)} tone="bg-crimson-50 text-crimson-700" />
        <KpiTile icon="clock" label="On Leave" value={String(data.on_leave_today)} tone="bg-gold-100 text-gold-700" />
        <KpiTile icon="users" label="Pending Approvals" value={String(data.pending_regularisations)} tone="bg-amber-50 text-amber-700" />
        <KpiTile icon="chart" label="Presence Rate" value={`${presentRate}%`} tone="bg-sky-50 text-sky-700" sub="of marked staff today" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FeatureCatalogue title="Attendance & leave capability" items={ATTENDANCE_FEATURES} />
        <ExceptionPanel title="Needs attention" empty="No pending regularisations or leave queues.">
          {data.pending_regularisations > 0 && (
            <p className="text-sm text-ink-700">
              <span className="text-2xl font-semibold text-ink-900">{data.pending_regularisations}</span>
              <span className="ml-2">item(s) awaiting manager / HR action before lock.</span>
            </p>
          )}
          {data.absent_today > 0 && (
            <p className="text-sm text-ink-600">{data.absent_today} absent today — review for LOP or leave conversion.</p>
          )}
          {data.on_leave_today > 0 && (
            <p className="text-sm text-ink-600">{data.on_leave_today} on approved leave — ensure substitutes are assigned.</p>
          )}
        </ExceptionPanel>
      </div>

      <QuickLinks links={ATTENDANCE_LINKS} />
    </div>
  );
}
