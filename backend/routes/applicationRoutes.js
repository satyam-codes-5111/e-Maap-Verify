import { Router } from 'express';
import * as applicationController from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  createApplicationSchema,
  updateDraftApplicationSchema,
  reviewApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
} from '../validators/applicationValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);

router.get('/', applicationController.getApplications);

router.post(
  '/',
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(createApplicationSchema),
  applicationController.createApplication
);

router.get('/:id', applicationController.getApplicationById);

router.get('/:id/history', applicationController.getApplicationHistory);

router.patch(
  '/:id',
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateDraftApplicationSchema),
  applicationController.updateApplication
);

router.put(
  '/:id',
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateDraftApplicationSchema),
  applicationController.updateApplication
);

router.post(
  '/:id/submit',
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  applicationController.submitApplication
);

router.patch(
  '/:id/submit',
  authorize(USER_ROLES.BUSINESS_USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  applicationController.submitApplication
);

router.post(
  '/:id/review',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER, USER_ROLES.GATC_OFFICER),
  validate(reviewApplicationSchema),
  applicationController.reviewApplication
);

router.patch(
  '/:id/review',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER, USER_ROLES.GATC_OFFICER),
  validate(reviewApplicationSchema),
  applicationController.reviewApplication
);

router.post(
  '/:id/approve',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(approveApplicationSchema),
  applicationController.approveApplication
);

router.patch(
  '/:id/approve',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(approveApplicationSchema),
  applicationController.approveApplication
);

router.post(
  '/:id/reject',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rejectApplicationSchema),
  applicationController.rejectApplication
);

router.patch(
  '/:id/reject',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rejectApplicationSchema),
  applicationController.rejectApplication
);

router.post(
  '/:id/documents',
  upload.single('document'),
  applicationController.uploadApplicationDocument
);

export default router;
