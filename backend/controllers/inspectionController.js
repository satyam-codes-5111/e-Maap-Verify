import mongoose from 'mongoose';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  APPLICATION_STATUSES,
  INSPECTION_STATUSES,
  AUDIT_ACTIONS,
  USER_ROLES,
} from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';
import * as inspectionService from '../services/inspectionService.js';
import { cleanupFile, validateUploadedFile } from '../utils/fileSecurity.js';

/**
 * Controller: Start Field Inspection for a Schedule
 * POST /api/inspections/:scheduleId/start
 */
export const startInspection = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
    throw ApiError.badRequest('Invalid schedule ID format');
  }
  const inspection = await inspectionService.startInspection(scheduleId, req.user);
  return ApiResponse.created(res, inspection, 'Field inspection started successfully.');
});

/**
 * Controller: Save or Update Inspection Draft
 * PUT /api/inspections/:id
 */
export const updateInspectionDraft = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid inspection ID format');
  }
  const inspection = await inspectionService.saveInspectionDraft(id, req.body, req.user);
  return ApiResponse.success(res, inspection, 'Inspection draft saved successfully.');
});

/**
 * Controller: Submit Inspection for Review / Finalization
 * POST /api/inspections/:id/submit
 */
export const submitInspection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid inspection ID format');
  }
  const inspection = await inspectionService.submitInspection(id, req.user);
  return ApiResponse.success(res, inspection, 'Inspection submitted successfully.');
});

/**
 * Controller: Finalize Inspection (Statutory Verdict)
 * POST /api/inspections/:id/finalize
 */
export const finalizeInspection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid inspection ID format');
  }
  const result = await inspectionService.finalizeInspection(id, req.body, req.user);
  return ApiResponse.success(
    res,
    result,
    result.verdict === 'VERIFIED'
      ? 'Verification finalized: Instrument verified and official certificate issued.'
      : 'Verification finalized: Instrument rejected due to non-compliance.'
  );
});

/**
 * Controller: Administrative Reopen of Finalized Inspection
 * POST /api/inspections/:id/reopen
 */
export const reopenInspection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid inspection ID format');
  }
  const { reason } = req.body;
  const inspection = await inspectionService.reopenInspection(id, reason, req.user);
  return ApiResponse.success(res, inspection, 'Inspection record reopened for administrative review.');
});

/**
 * Controller: Upload Evidence / Photo
 * POST /api/inspections/:id/evidence
 */
export const uploadEvidence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid inspection ID format');
  }

  const inspection = await VerificationInspection.findById(id);
  if (!inspection) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.notFound('Inspection record not found.');
  }

  // Officer / Admin authorization check
  const isAssigned =
    String(inspection.assignedOfficer) === String(req.user._id) ||
    String(inspection.officer) === String(req.user._id);
  const isAdmin = req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.forbidden('You are not authorized to upload evidence for this inspection.');
  }

  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest('Cannot upload evidence to a finalized inspection.');
  }

  const file = req.file || req.body.fileData || req.body.file || req.body.evidence;
  if (!file) {
    throw ApiError.badRequest('No evidence file was uploaded.');
  }
  const result = await inspectionService.uploadEvidence(
    id,
    file,
    req.body.caption,
    req.user,
    { latitude: req.body.latitude, longitude: req.body.longitude }
  );
  const inspectionDoc = result.inspection?.toObject ? result.inspection.toObject() : (result.inspection || {});
  const responseData = {
    ...inspectionDoc,
    fileUrl: result.fileUrl || result.url,
    url: result.fileUrl || result.url,
    caption: result.caption,
    photographs: result.photographs || inspectionDoc.photographs || [],
    photos: result.photos || inspectionDoc.photos || [],
    inspection: inspectionDoc,
  };
  return ApiResponse.created(res, responseData, 'Inspection evidence uploaded successfully.');
});

/**
 * Controller: Get Single Inspection Details
 * GET /api/inspections/:id
 */
export const getInspection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid inspection ID format');
  }
  const inspection = await inspectionService.getInspectionById(id, req.user);
  return ApiResponse.success(res, inspection, 'Inspection details retrieved successfully.');
});

/**
 * Controller: List Inspections with Filters & Pagination
 * GET /api/inspections
 */
export const listInspections = asyncHandler(async (req, res) => {
  const data = await inspectionService.listInspections(req.query, req.user);
  return ApiResponse.success(res, data, 'Inspections retrieved successfully.');
});

/**
 * Controller: Get My Assigned Inspections (Officers)
 * GET /api/inspections/my
 */
export const getMyInspections = asyncHandler(async (req, res) => {
  const data = await inspectionService.listInspections({ ...req.query, all: 'false' }, req.user);
  return ApiResponse.success(res, data, 'My assigned inspections retrieved successfully.');
});

/**
 * Controller: Get Inspection History / Audit Trail
 * GET /api/inspections/:id/history
 */
export const getInspectionHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid inspection ID format');
  }
  // Ensure user has access to this inspection
  await inspectionService.getInspectionById(id, req.user);

  const logs = await AuditLog.find({
    entity: 'VerificationInspection',
    entityId: id,
  })
    .sort({ timestamp: -1 })
    .lean();

  return ApiResponse.success(res, logs, 'Inspection audit history retrieved successfully.');
});

/**
 * Controller: Get Officer Dashboard Real Inspection Metrics
 * GET /api/inspections/dashboard/metrics
 */
export const getInspectionMetrics = asyncHandler(async (req, res) => {
  const metrics = await inspectionService.getOfficerDashboardMetrics(req.user);
  return ApiResponse.success(res, metrics, 'Inspection dashboard metrics retrieved successfully.');
});

/**
 * Legacy Support: Get Assigned Inspections Queue
 * GET /api/inspections/assigned
 */
export const getAssignedInspections = asyncHandler(async (req, res) => {
  const filter = {
    currentStatus: {
      $in: [
        APPLICATION_STATUSES.SCHEDULED,
        APPLICATION_STATUSES.INSPECTION,
      ],
    },
  };

  if (
    req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER ||
    req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER
  ) {
    filter.assignedLMO = req.user._id;
  }

  const applications = await VerificationApplication.find(filter)
    .populate('instrument')
    .populate('stakeholder')
    .sort({ preferredVerificationDate: 1 });

  return ApiResponse.success(res, applications, 'Assigned inspections queue retrieved');
});

/**
 * Legacy Support: Record Inspection directly
 * POST /api/inspections
 */
export const recordInspection = asyncHandler(async (req, res) => {
  const {
    applicationId,
    gpsCoordinates,
    instrumentCondition,
    standardsUsed,
    measurementReadings,
    stampingAndSealing,
    remarks,
  } = req.body;

  const application = await VerificationApplication.findById(applicationId);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  if (
    application.currentStatus !== APPLICATION_STATUSES.SCHEDULED &&
    application.currentStatus !== APPLICATION_STATUSES.INSPECTION
  ) {
    throw ApiError.badRequest(
      `Cannot record inspection on application in '${application.currentStatus}' state. Must be SCHEDULED or INSPECTION.`
    );
  }

  let inspection = await VerificationInspection.findOne({ application: application._id });

  if (inspection) {
    inspection.visitDateTime = new Date();
    inspection.gpsCoordinates = gpsCoordinates || inspection.gpsCoordinates;
    inspection.instrumentCondition = instrumentCondition || inspection.instrumentCondition;
    inspection.standardsUsed = standardsUsed || inspection.standardsUsed;
    inspection.measurementReadings = measurementReadings || inspection.measurementReadings;
    inspection.stampingAndSealing = stampingAndSealing || inspection.stampingAndSealing;
    inspection.remarks = remarks || inspection.remarks;
    inspection.inspectionStatus = 'COMPLETED';
    inspection.updatedBy = req.user._id;
  } else {
    const inspectionNumber = `INSP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    inspection = new VerificationInspection({
      inspectionNumber,
      application: application._id,
      instrument: application.instrument,
      stakeholder: application.stakeholder,
      officer: req.user._id,
      assignedOfficer: req.user._id,
      visitDateTime: new Date(),
      gpsCoordinates,
      instrumentCondition,
      standardsUsed,
      measurementReadings,
      stampingAndSealing,
      remarks,
      inspectionStatus: 'COMPLETED',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
  }

  await inspection.save();

  application.currentStatus = APPLICATION_STATUSES.INSPECTION;
  application.statusHistory.push({
    fromStatus: APPLICATION_STATUSES.SCHEDULED,
    toStatus: APPLICATION_STATUSES.INSPECTION,
    changedBy: req.user._id,
    remarks: 'Field metrological testing and sealing inspection recorded',
    timestamp: new Date(),
  });
  await application.save();

  await VerificationSchedule.findOneAndUpdate(
    { application: application._id },
    { status: 'COMPLETED' }
  );

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.INSPECTION_RECORDED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      applicationNumber: application.applicationNumber,
      readingsCount: measurementReadings?.length,
    },
  });

  return ApiResponse.created(res, inspection, 'Inspection details recorded successfully');
});

/**
 * Legacy Support: Upload Photo
 * POST /api/inspections/:id/photos
 */
export const uploadInspectionPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No photograph uploaded');
  }

  const inspection = await VerificationInspection.findById(req.params.id);
  if (!inspection) {
    cleanupFile(req.file.path);
    throw ApiError.notFound('Inspection record not found');
  }

  // Officer / Admin authorization check
  const isAssigned =
    String(inspection.assignedOfficer) === String(req.user._id) ||
    String(inspection.officer) === String(req.user._id);
  const isAdmin = req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden('You are not authorized to upload photos for this inspection.');
  }

  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    cleanupFile(req.file.path);
    throw ApiError.badRequest('Cannot upload evidence to a finalized inspection.');
  }

  // Validate uploaded file magic bytes & security
  await validateUploadedFile(req.file);

  const photo = {
    caption: req.body.caption || 'Field Test Verification Evidence',
    fileUrl: `/uploads/instrument-photos/${req.file.filename}`,
    uploadedAt: new Date(),
  };

  inspection.photos.push(photo);
  inspection.photographs.push(photo);
  await inspection.save();

  return ApiResponse.created(res, inspection, 'Inspection photo uploaded successfully');
});

/**
 * Controller: Auto-populate inspection checklist fields from scanned instrument ID / QR Code
 * POST /api/inspections/:id/populate-from-scan
 * POST /api/inspections/auto-populate-checklist
 */
export const autoPopulateInspectionChecklist = asyncHandler(async (req, res) => {
  const inspectionId = req.params.id || req.body.inspectionId;
  const rawCode =
    req.body.scannedCode ||
    req.body.instrumentId ||
    req.body.code ||
    req.body.token ||
    req.query.q ||
    req.query.code;

  if (!rawCode) {
    throw ApiError.badRequest('Scanned instrument ID, QR code, or serial number is required.');
  }

  if (inspectionId && !mongoose.Types.ObjectId.isValid(inspectionId)) {
    throw ApiError.badRequest('Invalid inspection ID format.');
  }

  const result = await inspectionService.autoPopulateInspectionFromScannedInstrument(
    rawCode,
    { inspectionId },
    req.user
  );

  return ApiResponse.success(
    res,
    result,
    'Inspection checklist fields and statutory accuracy load tests auto-populated successfully from scanned instrument.'
  );
});

