import { Router } from 'express';
import { getAdminDashboardSummary } from '../controllers/adminDashboardController.js';
import {
  getApplicationAnalytics,
  getVerificationAnalytics,
  getCertificateAnalytics,
  getScheduleAnalytics,
  getOfficerWorkload,
  getInstrumentAnalytics,
  getStakeholderAnalytics,
} from '../controllers/adminAnalyticsController.js';
import {
  getAdminReports,
  exportAdminReports,
  getDatabaseIntegrityReport,
} from '../controllers/adminReportController.js';
import { getAuditLogs } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// Authentication required for all admin routes
router.use(protect);

// RBAC: Restricted strictly to SUPER_ADMIN and ADMIN
router.use(authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN));

// Diagnostics & Integrity API
router.get('/diagnostics/integrity', getDatabaseIntegrityReport);

// Dashboard Summary API
router.get('/dashboard/summary', getAdminDashboardSummary);

// Analytics Engine APIs
router.get('/analytics/applications', getApplicationAnalytics);
router.get('/analytics/verifications', getVerificationAnalytics);
router.get('/analytics/certificates', getCertificateAnalytics);
router.get('/analytics/schedules', getScheduleAnalytics);
router.get('/analytics/officers', getOfficerWorkload);
router.get('/analytics/instruments', getInstrumentAnalytics);
router.get('/analytics/stakeholders', getStakeholderAnalytics);

// Report & Export APIs
router.get('/reports', getAdminReports);
router.get('/reports/export', exportAdminReports);
router.get('/audit-logs', getAuditLogs);

export default router;
