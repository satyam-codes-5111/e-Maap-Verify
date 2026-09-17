import { Router } from 'express';
import * as stakeholderController from '../controllers/stakeholderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  updateStakeholderSchema,
  updateKycStatusSchema,
} from '../validators/stakeholderValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);

// Current authenticated business user profile
router.get(
  '/me',
  authorize(USER_ROLES.BUSINESS_USER),
  stakeholderController.getMyStakeholderProfile
);

router.put(
  '/me',
  authorize(USER_ROLES.BUSINESS_USER),
  validate(updateStakeholderSchema),
  stakeholderController.updateStakeholderProfile
);

router.patch(
  '/me',
  authorize(USER_ROLES.BUSINESS_USER),
  validate(updateStakeholderSchema),
  stakeholderController.updateStakeholderProfile
);

router.post(
  '/me/upload-kyc',
  authorize(USER_ROLES.BUSINESS_USER),
  upload.single('document'),
  stakeholderController.uploadKycDocument
);

// Administrative / Officer routes
router.get(
  '/',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  stakeholderController.getStakeholders
);

router.get(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  stakeholderController.getStakeholderById
);

router.put(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateStakeholderSchema),
  stakeholderController.updateStakeholderProfile
);

router.patch(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateStakeholderSchema),
  stakeholderController.updateStakeholderProfile
);

router.patch(
  '/:id/kyc-status',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateKycStatusSchema),
  stakeholderController.updateKycStatus
);

export default router;
