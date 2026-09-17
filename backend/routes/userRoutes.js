import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validate } from '../validators/authValidator.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// Protect all routes with JWT middleware
router.use(protect);

router.get(
  '/officers/list',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER),
  userController.getActiveOfficers
);

router.get(
  '/',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  userController.getUsers
);

router.post(
  '/',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(createUserSchema),
  userController.createUser
);

router.get(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  userController.getUserById
);

router.put(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateUserSchema),
  userController.updateUser
);

router.patch(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(updateUserSchema),
  userController.updateUser
);

router.patch(
  '/:id/status',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  userController.toggleUserStatus
);

router.delete(
  '/:id',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  userController.deleteOrDeactivateUser
);

export default router;
