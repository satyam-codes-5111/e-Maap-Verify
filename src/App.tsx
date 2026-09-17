import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { AppShell } from './components/layout/AppShell';
import { AdminLayout } from './components/layout/AdminLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { ScrollToTop } from './components/common/ScrollToTop';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { VerifyCertificatePage } from './pages/public/VerifyCertificatePage';

// Applicant Pages
import { ApplicantDashboard } from './pages/applicant/ApplicantDashboard';
import { RegisterInstrumentPage } from './pages/applicant/RegisterInstrumentPage';
import { ApplicantInstrumentsPage } from './pages/applicant/ApplicantInstrumentsPage';
import { ApplicantApplicationsPage } from './pages/applicant/ApplicantApplicationsPage';
import { ApplicationDetailPage } from './pages/applicant/ApplicationDetailPage';
import { ApplicantCertificatesPage } from './pages/applicant/ApplicantCertificatesPage';
import { ApplicantDocumentsPage } from './pages/applicant/ApplicantDocumentsPage';
import { ApplicantProfilePage } from './pages/applicant/ApplicantProfilePage';
import { ApplicantNotificationsPage } from './pages/applicant/ApplicantNotificationsPage';

// Officer Pages
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { OfficerSchedulesPage } from './pages/officer/OfficerSchedulesPage';
import { OfficerInspectionsPage } from './pages/officer/OfficerInspectionsPage';
import { InspectionChecklistPage } from './pages/officer/InspectionChecklistPage';
import { InspectionEvidencePage } from './pages/officer/InspectionEvidencePage';
import { InspectionResultPage } from './pages/officer/InspectionResultPage';
import { OfficerCertificatesPage } from './pages/officer/OfficerCertificatesPage';
import { OfficerProfilePage } from './pages/officer/OfficerProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';
import { AdminInstrumentsPage } from './pages/admin/AdminInstrumentsPage';
import { AdminStakeholdersPage } from './pages/admin/AdminStakeholdersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

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
          <Routes>
            {/* Public Portal Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
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
                  <AppShell />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ApplicantDashboard />} />
            <Route path="register-instrument" element={<RegisterInstrumentPage />} />
            <Route path="instruments" element={<ApplicantInstrumentsPage />} />
            <Route path="applications" element={<ApplicantApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />
            <Route path="certificates" element={<ApplicantCertificatesPage />} />
            <Route path="documents" element={<ApplicantDocumentsPage />} />
            <Route path="profile" element={<ApplicantProfilePage />} />
            <Route path="notifications" element={<ApplicantNotificationsPage />} />
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
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
