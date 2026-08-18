import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { GuestRoute, ProtectedRoute, RequirePermission } from './routes/ProtectedRoute';
import { institutionalRouteElements } from './routes/InstitutionalRoutes';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { OrgStructurePage } from './pages/org/OrgStructurePage';
import { GlobalConfigPage } from './pages/config/GlobalConfigPage';
import { RolesPage } from './pages/roles/RolesPage';
import { PurchaseDashboardPage } from './pages/purchase/PurchaseDashboardPage';
import { VendorsPage } from './pages/purchase/VendorsPage';
import { CatalogPage } from './pages/purchase/CatalogPage';
import { RequisitionsPage } from './pages/purchase/RequisitionsPage';
import { QuotationsPage } from './pages/purchase/QuotationsPage';
import { PurchaseOrdersPage } from './pages/purchase/PurchaseOrdersPage';
import { GrnPage } from './pages/purchase/GrnPage';
import { BillsPage } from './pages/purchase/BillsPage';
import { StoresDashboardPage } from './pages/stores/StoresDashboardPage';
import { StoresListPage } from './pages/stores/StoresListPage';
import { StockLedgerPage } from './pages/stores/StockLedgerPage';
import { StockIssuesPage } from './pages/stores/StockIssuesPage';
import { ExecutiveCommandPage } from './pages/executive/ExecutiveCommandPage';
import { ExecutiveApprovalsPage } from './pages/executive/ExecutiveApprovalsPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/executive" element={<RequirePermission permission="reports:read"><ExecutiveCommandPage /></RequirePermission>} />
              <Route path="/executive/approvals" element={<RequirePermission permission="reports:read"><ExecutiveApprovalsPage /></RequirePermission>} />
              <Route path="/org" element={<RequirePermission permission="org:read"><OrgStructurePage /></RequirePermission>} />
              <Route path="/config" element={<RequirePermission permission="config:read"><GlobalConfigPage /></RequirePermission>} />
              <Route path="/roles" element={<RequirePermission permission="role:read"><RolesPage /></RequirePermission>} />
              <Route path="/purchase" element={<RequirePermission permission="vendor:read"><PurchaseDashboardPage /></RequirePermission>} />
              <Route path="/purchase/vendors" element={<RequirePermission permission="vendor:read"><VendorsPage /></RequirePermission>} />
              <Route path="/purchase/catalog" element={<RequirePermission permission="catalog:read"><CatalogPage /></RequirePermission>} />
              <Route path="/purchase/requisitions" element={<RequirePermission permission="indent:read"><RequisitionsPage /></RequirePermission>} />
              <Route path="/purchase/indents" element={<RequirePermission permission="indent:read"><RequisitionsPage /></RequirePermission>} />
              <Route path="/purchase/quotations" element={<RequirePermission permission="quotation:read"><QuotationsPage /></RequirePermission>} />
              <Route path="/purchase/orders" element={<RequirePermission permission="po:read"><PurchaseOrdersPage /></RequirePermission>} />
              <Route path="/purchase/grn" element={<RequirePermission permission="grn:read"><GrnPage /></RequirePermission>} />
              <Route path="/purchase/bills" element={<RequirePermission permission="bill:read"><BillsPage /></RequirePermission>} />
              <Route path="/stores" element={<RequirePermission permission="stores:read"><StoresDashboardPage /></RequirePermission>} />
              <Route path="/stores/list" element={<RequirePermission permission="stores:read"><StoresListPage /></RequirePermission>} />
              <Route path="/stores/stock" element={<RequirePermission permission="stores:read"><StockLedgerPage /></RequirePermission>} />
              <Route path="/stores/issues" element={<RequirePermission permission="stores:read"><StockIssuesPage /></RequirePermission>} />
              {institutionalRouteElements()}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
