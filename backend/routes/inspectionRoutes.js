import { Router } from 'express';
import * as inspectionController from '../controllers/inspectionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validate } from '../validators/authValidator.js';
import {
  inspectionSubmissionSchema,
  finalizeInspectionSchema,
  reopenInspectionSchema,
} from '../validators/verificationValidator.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// Evidence file upload wrapper accepting multipart evidence files under any field name or JSON body
const uploadEvidenceFile = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.use(protect);

// Specific GET endpoints (MUST precede /:id)
router.get(
  '/dashboard/metrics',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.getInspectionMetrics
);

router.get(
  '/assigned',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER,
    USER_ROLES.GATC_OFFICER
  ),
  inspectionController.getAssignedInspections
);

router.get(
  '/my',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.getMyInspections
);

// General list endpoint with role filtering in service
router.get('/', inspectionController.listInspections);

// Auto-populate checklist preview from scanned instrument QR code / ID
router.post(
  '/auto-populate-checklist',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.autoPopulateInspectionChecklist
);

// Auto-populate existing inspection draft from scanned instrument QR code
router.post(
  '/:id/populate-from-scan',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.autoPopulateInspectionChecklist
);

// Start an inspection for a schedule
router.post(
  '/:scheduleId/start',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.startInspection
);

// Update inspection draft
router.put(
  '/:id',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.updateInspectionDraft
);

router.patch(
  '/:id',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.updateInspectionDraft
);

// Submit inspection
router.post(
  '/:id/submit',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  inspectionController.submitInspection
);

// Finalize statutory verification verdict (Strictly LMO / Admin only)
router.post(
  '/:id/finalize',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER
  ),
  validate(finalizeInspectionSchema),
  inspectionController.finalizeInspection
);

// Administrative reopen (SUPER_ADMIN and ADMIN only)
router.post(
  '/:id/reopen',
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  validate(reopenInspectionSchema),
  inspectionController.reopenInspection
);

// Upload evidence
router.post(
  '/:id/evidence',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  uploadEvidenceFile,
  inspectionController.uploadEvidence
);

// Legacy photo upload
router.post(
  '/:id/photos',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER
  ),
  upload.single('photo'),
  inspectionController.uploadInspectionPhoto
);

// Inspection history / audit trail
router.get('/:id/history', inspectionController.getInspectionHistory);

// Single inspection detail
router.get('/:id', inspectionController.getInspection);

// Legacy direct record endpoint
router.post(
  '/',
  authorize(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.FIELD_VERIFICATION_OFFICER,
    USER_ROLES.GATC_OFFICER
  ),
  validate(inspectionSubmissionSchema),
  inspectionController.recordInspection
);

export default router;
