import { Route } from 'react-router-dom';
import { RequirePermission } from './ProtectedRoute';
import { AssetsDashboardPage } from '../pages/assets/AssetsDashboardPage';
import { AssetRegisterPage } from '../pages/assets/AssetRegisterPage';
import { HrDashboardPage } from '../pages/hr/HrDashboardPage';
import { EmployeesPage } from '../pages/hr/EmployeesPage';
import { EmployeeProfilePage } from '../pages/hr/EmployeeProfilePage';
import { DesignationsPage } from '../pages/hr/DesignationsPage';
import { AttendanceDashboardPage } from '../pages/attendance/AttendanceDashboardPage';
import { DailyAttendancePage } from '../pages/attendance/DailyAttendancePage';
import { LeaveApplicationsPage } from '../pages/attendance/LeaveApplicationsPage';
import { LeaveBalancesPage } from '../pages/attendance/LeaveBalancesPage';
import { PayrollDashboardPage } from '../pages/payroll/PayrollDashboardPage';
import { PayrollRunsPage } from '../pages/payroll/PayrollRunsPage';
import { PayslipsPage } from '../pages/payroll/PayslipsPage';
import { AccountsDashboardPage } from '../pages/accounts/AccountsDashboardPage';
import { ChartOfAccountsPage } from '../pages/accounts/ChartOfAccountsPage';
import { VouchersPage } from '../pages/accounts/VouchersPage';
import { BudgetsPage } from '../pages/accounts/BudgetsPage';
import { TrialBalancePage } from '../pages/accounts/TrialBalancePage';
import { FeesOverviewPage } from '../pages/fees/FeesOverviewPage';
import { ReportsCentrePage } from '../pages/reports/ReportsCentrePage';

/** Institutional module routes (assets → reports). */
export function institutionalRouteElements() {
  return (
    <>
      <Route path="/assets" element={<RequirePermission permission="assets:read"><AssetsDashboardPage /></RequirePermission>} />
      <Route path="/assets/register" element={<RequirePermission permission="assets:read"><AssetRegisterPage /></RequirePermission>} />
      <Route path="/hr" element={<RequirePermission permission="hr:read"><HrDashboardPage /></RequirePermission>} />
      <Route path="/hr/employees" element={<RequirePermission permission="hr:read"><EmployeesPage /></RequirePermission>} />
      <Route path="/hr/employees/:id" element={<RequirePermission permission="hr:read"><EmployeeProfilePage /></RequirePermission>} />
      <Route path="/hr/designations" element={<RequirePermission permission="hr:read"><DesignationsPage /></RequirePermission>} />
      <Route path="/attendance" element={<RequirePermission permission="attendance:read"><AttendanceDashboardPage /></RequirePermission>} />
      <Route path="/attendance/daily" element={<RequirePermission permission="attendance:read"><DailyAttendancePage /></RequirePermission>} />
      <Route path="/attendance/leave" element={<RequirePermission permission="leave:read"><LeaveApplicationsPage /></RequirePermission>} />
      <Route path="/attendance/balances" element={<RequirePermission permission="leave:read"><LeaveBalancesPage /></RequirePermission>} />
      <Route path="/payroll" element={<RequirePermission permission="payroll:read"><PayrollDashboardPage /></RequirePermission>} />
      <Route path="/payroll/runs" element={<RequirePermission permission="payroll:read"><PayrollRunsPage /></RequirePermission>} />
      <Route path="/payroll/payslips" element={<RequirePermission permission="payroll:read"><PayslipsPage /></RequirePermission>} />
      <Route path="/accounts" element={<RequirePermission permission="accounts:read"><AccountsDashboardPage /></RequirePermission>} />
      <Route
        path="/fees"
        element={
          <RequirePermission anyOf={['accounts:read', 'reports:read']}>
            <FeesOverviewPage />
          </RequirePermission>
        }
      />
      <Route path="/accounts/coa" element={<RequirePermission permission="accounts:read"><ChartOfAccountsPage /></RequirePermission>} />
      <Route path="/accounts/vouchers" element={<RequirePermission permission="accounts:read"><VouchersPage /></RequirePermission>} />
      <Route path="/accounts/budgets" element={<RequirePermission permission="budget:read"><BudgetsPage /></RequirePermission>} />
      <Route path="/accounts/trial-balance" element={<RequirePermission permission="accounts:read"><TrialBalancePage /></RequirePermission>} />
      <Route path="/reports" element={<RequirePermission permission="reports:read"><ReportsCentrePage /></RequirePermission>} />
    </>
  );
}
