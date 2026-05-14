import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ProgrammeDashboard from './pages/ProgrammeDashboard';
import PriorityActionDashboard from './pages/PriorityActionDashboard';
import ComplianceScorecard from './pages/ComplianceScorecard';
import ReportPortal from './pages/ReportPortal';

// GRC Pages
import StatementOfApplicability from './pages/StatementOfApplicability';
import DocumentManagement from './pages/DocumentManagement';
import LegalRegisters from './pages/LegalRegisters';
import HumanResources from './pages/HumanResources';

// Audit Pages
import AuditPortfolio from './pages/audit/AuditPortfolio';
import FindingsRegister from './pages/audit/FindingsRegister';
import EvidenceLibrary from './pages/audit/EvidenceLibrary';
import ActionTracker from './pages/audit/ActionTracker';
import AuditCalendar from './pages/audit/AuditCalendar';
import AuditMetrics from './pages/audit/AuditMetrics';

// Control Assurance Pages
import ControlLibrary from './pages/ControlLibrary';
import UCIControls from './pages/UCIControls';
import UCIControlsFull from './pages/UCIControlsFull';
import CSIItems from './pages/CSIItems';
import WorkPackageManagement from './pages/WorkPackageManagement';

// Risk Management Pages
import CyberRiskAssessment from './pages/CyberRiskAssessment';
import RiskMapping from './pages/RiskMapping';
import VulnerabilityTracker from './pages/VulnerabilityTracker';
import PenTestTracker from './pages/PenTestTracker';
import VendorRiskManagement from './pages/VendorRiskManagement';

// Security Operations Pages
import SecurityIncidents from './pages/SecurityIncidents';
import AssetInventory from './pages/AssetInventory';
import BcDrPlans from './pages/BcDrPlans';

// Platform Admin Pages
import RoleManagement from './pages/RoleManagement';
import OrganizationManagement from './pages/OrganizationManagement';
import BulkImport from './pages/BulkImport';
import Settings from './pages/Settings';

// User Pages
import UserProfile from './pages/UserProfile';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function PrivateRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Core Dashboard */}
        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="programme-dashboard"
          element={<ProgrammeDashboard />}
        />

        <Route
          path="priority-actions"
          element={<PriorityActionDashboard />}
        />

        <Route
          path="scorecard"
          element={<ComplianceScorecard />}
        />

        <Route
          path="reports"
          element={<ReportPortal />}
        />

        {/* GRC */}
        <Route
          path="soa"
          element={<StatementOfApplicability />}
        />

        <Route
          path="documents"
          element={<DocumentManagement />}
        />

        <Route
          path="legal"
          element={<LegalRegisters />}
        />

        <Route
          path="hr"
          element={<HumanResources />}
        />

        {/* Audit */}
        <Route
          path="audits/portfolio"
          element={<AuditPortfolio />}
        />

        <Route
          path="audits/findings"
          element={<FindingsRegister />}
        />

        <Route
          path="audits/evidence"
          element={<EvidenceLibrary />}
        />

        <Route
          path="audits/actions"
          element={<ActionTracker />}
        />

        <Route
          path="audits/calendar"
          element={<AuditCalendar />}
        />

        <Route
          path="audits/metrics"
          element={<AuditMetrics />}
        />

        {/* Control Assurance */}
        <Route
          path="controls"
          element={<ControlLibrary />}
        />

        <Route
          path="uci-controls"
          element={<UCIControls />}
        />

        <Route
          path="uci-controls-full"
          element={<UCIControlsFull />}
        />

        <Route
          path="csi-items"
          element={<CSIItems />}
        />

        <Route
          path="work-packages"
          element={<WorkPackageManagement />}
        />

        {/* Risk Management */}
        <Route
          path="risk-assessment"
          element={<CyberRiskAssessment />}
        />

        <Route
          path="risk-mapping"
          element={<RiskMapping />}
        />

        <Route
          path="vulnerabilities"
          element={<VulnerabilityTracker />}
        />

        <Route
          path="pen-tests"
          element={<PenTestTracker />}
        />

        <Route
          path="vendors"
          element={<VendorRiskManagement />}
        />

        {/* Security Operations */}
        <Route
          path="incidents"
          element={<SecurityIncidents />}
        />

        <Route
          path="assets"
          element={<AssetInventory />}
        />

        <Route
          path="bc-dr"
          element={<BcDrPlans />}
        />

        {/* Platform Admin */}
        <Route
          path="admin/roles"
          element={<RoleManagement />}
        />

        <Route
          path="admin/organizations"
          element={<OrganizationManagement />}
        />

        <Route
          path="bulk-import"
          element={<BulkImport />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />

        {/* User */}
        <Route
          path="profile"
          element={<UserProfile />}
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
