import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { AppShell } from './components/layout/AppShell';
import { AdminLayout } from './components/layout/AdminLayout';
import { ApplicantLayout } from './components/layout/applicant/ApplicantLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { ScrollToTop } from './components/common/ScrollToTop';

// Public Pages
import { LoginPage } from './pages/public/LoginPage';

// Lazy-loaded Public Pages
const LandingPage = React.lazy(() =>
  import('./pages/public/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const VerifyCertificatePage = React.lazy(() =>
  import('./pages/public/VerifyCertificatePage').then((m) => ({ default: m.VerifyCertificatePage }))
);

// Lazy-loaded Applicant Pages
const ApplicantDashboard = React.lazy(() =>
  import('./pages/applicant/ApplicantDashboard').then((m) => ({ default: m.ApplicantDashboard }))
);
const RegisterInstrumentPage = React.lazy(() =>
  import('./pages/applicant/RegisterInstrumentPage').then((m) => ({ default: m.RegisterInstrumentPage }))
);
const ApplicantInstrumentsPage = React.lazy(() =>
  import('./pages/applicant/ApplicantInstrumentsPage').then((m) => ({ default: m.ApplicantInstrumentsPage }))
);
const ApplicantApplicationsPage = React.lazy(() =>
  import('./pages/applicant/ApplicantApplicationsPage').then((m) => ({ default: m.ApplicantApplicationsPage }))
);
const ApplicationDetailPage = React.lazy(() =>
  import('./pages/applicant/ApplicationDetailPage').then((m) => ({ default: m.ApplicationDetailPage }))
);
const ApplicantCertificatesPage = React.lazy(() =>
  import('./pages/applicant/ApplicantCertificatesPage').then((m) => ({ default: m.ApplicantCertificatesPage }))
);
const ApplicantDocumentsPage = React.lazy(() =>
  import('./pages/applicant/ApplicantDocumentsPage').then((m) => ({ default: m.ApplicantDocumentsPage }))
);
const ApplicantProfilePage = React.lazy(() =>
  import('./pages/applicant/ApplicantProfilePage').then((m) => ({ default: m.ApplicantProfilePage }))
);
const ApplicantNotificationsPage = React.lazy(() =>
  import('./pages/applicant/ApplicantNotificationsPage').then((m) => ({ default: m.ApplicantNotificationsPage }))
);
const ApplicantSchedulesPage = React.lazy(() =>
  import('./pages/applicant/ApplicantSchedulesPage').then((m) => ({ default: m.ApplicantSchedulesPage }))
);
const ApplicantHelpPage = React.lazy(() =>
  import('./pages/applicant/ApplicantHelpPage').then((m) => ({ default: m.ApplicantHelpPage }))
);

// Lazy-loaded Officer Pages
const OfficerDashboard = React.lazy(() =>
  import('./pages/officer/OfficerDashboard').then((m) => ({ default: m.OfficerDashboard }))
);
const OfficerSchedulesPage = React.lazy(() =>
  import('./pages/officer/OfficerSchedulesPage').then((m) => ({ default: m.OfficerSchedulesPage }))
);
const OfficerInspectionsPage = React.lazy(() =>
  import('./pages/officer/OfficerInspectionsPage').then((m) => ({ default: m.OfficerInspectionsPage }))
);
const InspectionChecklistPage = React.lazy(() =>
  import('./pages/officer/InspectionChecklistPage').then((m) => ({ default: m.InspectionChecklistPage }))
);
const InspectionEvidencePage = React.lazy(() =>
  import('./pages/officer/InspectionEvidencePage').then((m) => ({ default: m.InspectionEvidencePage }))
);
const InspectionResultPage = React.lazy(() =>
  import('./pages/officer/InspectionResultPage').then((m) => ({ default: m.InspectionResultPage }))
);
const OfficerCertificatesPage = React.lazy(() =>
  import('./pages/officer/OfficerCertificatesPage').then((m) => ({ default: m.OfficerCertificatesPage }))
);
const OfficerProfilePage = React.lazy(() =>
  import('./pages/officer/OfficerProfilePage').then((m) => ({ default: m.OfficerProfilePage }))
);

// Lazy-loaded Admin Pages
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminApplicationsPage = React.lazy(() =>
  import('./pages/admin/AdminApplicationsPage').then((m) => ({ default: m.AdminApplicationsPage }))
);
const AdminInstrumentsPage = React.lazy(() =>
  import('./pages/admin/AdminInstrumentsPage').then((m) => ({ default: m.AdminInstrumentsPage }))
);
const AdminStakeholdersPage = React.lazy(() =>
  import('./pages/admin/AdminStakeholdersPage').then((m) => ({ default: m.AdminStakeholdersPage }))
);
const AdminAnalyticsPage = React.lazy(() =>
  import('./pages/admin/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage }))
);
const AdminReportsPage = React.lazy(() =>
  import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage }))
);
const AdminUsersPage = React.lazy(() =>
  import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
);
const AdminAuditLogsPage = React.lazy(() =>
  import('./pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage }))
);

// Lightweight Suspense fallback screen
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-6">
    <div className="w-full max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-[#123B6D] border-t-transparent animate-spin" />
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-slate-200 rounded w-44 animate-pulse" />
          <div className="h-3 bg-slate-100 rounded w-28 animate-pulse" />
        </div>
      </div>
      <LoadingSkeleton type="card" rows={3} />
    </div>
  </div>
);

// Helper component for smart dashboard redirects based on current user session
const DashboardRedirect: React.FC = () => {
  const { user, loading, getRoleRedirectPath } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full">
          <LoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleRedirectPath(user.role)} replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ErrorBoundary>
          <React.Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Public Portal Routes */}
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/portal" element={<LandingPage />} />
              <Route path="/verify-certificate" element={<VerifyCertificatePage />} />

              {/* Smart Redirect to Role Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

            {/* Business Applicant Protected Portal */}
            <Route
              path="/applicant"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['BUSINESS_USER', 'SUPER_ADMIN', 'ADMIN']}>
                    <ApplicantLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ApplicantDashboard />} />
              <Route path="register-instrument" element={<RegisterInstrumentPage />} />
              <Route path="instruments/register" element={<RegisterInstrumentPage />} />
              <Route path="instruments" element={<ApplicantInstrumentsPage />} />
              <Route path="applications" element={<ApplicantApplicationsPage />} />
              <Route path="applications/:id" element={<ApplicationDetailPage />} />
              <Route path="schedules" element={<ApplicantSchedulesPage />} />
              <Route path="certificates" element={<ApplicantCertificatesPage />} />
              <Route path="documents" element={<ApplicantDocumentsPage />} />
              <Route path="profile" element={<ApplicantProfilePage />} />
              <Route path="notifications" element={<ApplicantNotificationsPage />} />
              <Route path="help" element={<ApplicantHelpPage />} />
            </Route>

            {/* Enforcement Officer Protected Portal */}
            <Route
              path="/officer"
              element={
                <ProtectedRoute>
                  <RoleRoute
                    allowedRoles={[
                      'LEGAL_METROLOGY_OFFICER',
                      'FIELD_VERIFICATION_OFFICER',
                      'GATC_OFFICER',
                      'SUPER_ADMIN',
                      'ADMIN',
                    ]}
                  >
                    <AppShell />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OfficerDashboard />} />
              <Route path="schedules" element={<OfficerSchedulesPage />} />
              <Route path="inspections" element={<OfficerInspectionsPage />} />
              <Route path="inspections/:id/checklist" element={<InspectionChecklistPage />} />
              <Route path="inspections/:id/evidence" element={<InspectionEvidencePage />} />
              <Route path="inspections/:id/result" element={<InspectionResultPage />} />
              <Route path="certificates" element={<OfficerCertificatesPage />} />
              <Route path="notifications" element={<ApplicantNotificationsPage />} />
              <Route path="profile" element={<OfficerProfilePage />} />
            </Route>

            {/* Central Administration Command Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="applications" element={<AdminApplicationsPage />} />
              <Route path="applications/:id" element={<ApplicationDetailPage />} />
              <Route path="instruments" element={<AdminInstrumentsPage />} />
              <Route path="stakeholders" element={<AdminStakeholdersPage />} />
              <Route path="schedules" element={<OfficerSchedulesPage />} />
              <Route path="inspections" element={<OfficerInspectionsPage />} />
              <Route path="certificates" element={<OfficerCertificatesPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="notifications" element={<ApplicantNotificationsPage />} />
              <Route path="profile" element={<OfficerProfilePage />} />
            </Route>

            {/* Catch-all 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
