import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  scheduleApplicationSchema,
  rescheduleApplicationSchema,
  cancelScheduleSchema,
} from '../validators/applicationValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);

// Specific GET routes before parameterized :id
router.get('/calendar', scheduleController.getCalendarSchedules);
router.get('/availability', scheduleController.checkAvailability);
router.get('/my', scheduleController.getMySchedules);
router.get('/', scheduleController.getSchedules);

// Creation
router.post(
  '/',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(scheduleApplicationSchema),
  scheduleController.scheduleApplication
);

// Detail view
router.get('/:id', scheduleController.getScheduleById);

// Reschedule
router.post(
  '/:id/reschedule',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rescheduleApplicationSchema),
  scheduleController.rescheduleApplication
);

router.patch(
  '/:id/reschedule',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(rescheduleApplicationSchema),
  scheduleController.rescheduleApplication
);

// Cancel
router.post(
  '/:id/cancel',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(cancelScheduleSchema),
  scheduleController.cancelSchedule
);

router.patch(
  '/:id/cancel',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  validate(cancelScheduleSchema),
  scheduleController.cancelSchedule
);

// Status update
router.patch(
  '/:id/status',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  scheduleController.updateScheduleStatus
);

export default router;
