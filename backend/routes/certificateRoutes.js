import { Router } from 'express';
import * as certificateController from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

// PUBLIC QR verification endpoint (no authentication required)
// Accessible at GET /api/certificates/verify/:token
router.get('/verify/:token', certificateController.verifyCertificatePublic);

// PROTECTED routes - require valid JWT
router.use(protect);

// Generate Certificate for a finalized PASSED/VERIFIED inspection
// POST /api/certificates/generate or /api/certificates/generate/:inspectionId
router.post(
  ['/generate', '/generate/:inspectionId'],
  authorize(USER_ROLES.LEGAL_METROLOGY_OFFICER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  certificateController.generateCertificate
);

// List certificates with pagination, filtering, search
router.get('/', certificateController.getCertificates);

// Get certificate details by ID
router.get('/:id', certificateController.getCertificateById);

// Download Certificate PDF - Supports canonical /:id/pdf and /:id/download
router.get('/:id/pdf', certificateController.downloadCertificatePdf);
router.get('/:id/download', certificateController.downloadCertificatePdf);

// Revoke Certificate (Admin only) - supports PATCH and POST
router.route('/:id/revoke')
  .all(authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN))
  .patch(certificateController.revokeCertificate)
  .post(certificateController.revokeCertificate);

export default router;
