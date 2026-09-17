import { Router } from 'express';
import * as resultController from '../controllers/resultController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../validators/authValidator.js';
import { verificationVerdictSchema } from '../validators/verificationValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);

router.post(
  '/',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  validate(verificationVerdictSchema),
  resultController.submitVerificationVerdict
);

router.get(
  '/application/:applicationId',
  resultController.getResultByApplicationId
);

export default router;
