import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);

// Verification Summary Report
router.get(
  '/summary',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  reportController.getVerificationSummaryReport
);

// Revenue & Statutory Fees Collection Report
router.get(
  '/revenue',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  reportController.getRevenueReport
);

// Instruments Statutory Compliance Report
router.get(
  '/instruments-compliance',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  reportController.getInstrumentComplianceReport
);

// Officer Performance & Workload Analytics Report
router.get(
  '/officer-performance',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  reportController.getOfficerPerformanceReport
);

// Audit Trail & Logs
router.get(
  '/audit-logs',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  reportController.getAuditLogs
);

// Data Export (CSV & JSON)
router.get(
  '/export',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  reportController.exportReport
);

export default router;
