import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);

router.get(
  '/admin',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  dashboardController.getAdminDashboard
);

router.get(
  '/officer',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER,
    USER_ROLES.GATC_OFFICER
  ),
  dashboardController.getOfficerDashboard
);

router.get(
  '/stakeholder',
  authorize(USER_ROLES.BUSINESS_USER),
  dashboardController.getStakeholderDashboard
);

export default router;
