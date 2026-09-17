import { Router } from 'express';
import * as instrumentController from '../controllers/instrumentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  createInstrumentSchema,
  updateInstrumentSchema,
} from '../validators/instrumentValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(protect);

// Expiring summary endpoint
router.get(
  '/expiring/summary',
  instrumentController.getExpiringInstrumentsSummary
);

// List instruments with filters & pagination
router.get(
  '/',
  instrumentController.getInstruments
);

// Register new instrument
router.post(
  '/',
  authorize(
    USER_ROLES.BUSINESS_USER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER
  ),
  validate(createInstrumentSchema),
  instrumentController.createInstrument
);

// Get single instrument by ID
router.get(
  '/:id',
  instrumentController.getInstrumentById
);

// Update instrument
router.put(
  '/:id',
  validate(updateInstrumentSchema),
  instrumentController.updateInstrument
);

router.patch(
  '/:id',
  validate(updateInstrumentSchema),
  instrumentController.updateInstrument
);

// Delete or safely deactivate instrument
router.delete(
  '/:id',
  instrumentController.deleteInstrument
);

// Upload instrument photographs
router.post(
  '/:id/photos',
  upload.single('photo'),
  instrumentController.uploadInstrumentPhoto
);

// Upload instrument statutory documents
router.post(
  '/:id/documents',
  upload.single('document'),
  instrumentController.uploadInstrumentDocument
);

export default router;
