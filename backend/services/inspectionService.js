import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { Instrument } from '../models/Instrument.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import {
  APPLICATION_STATUSES,
  SCHEDULE_STATUSES,
  INSTRUMENT_STATUSES,
  INSPECTION_STATUSES,
  INSPECTION_RESULTS,
  VERIFICATION_VERDICTS,
  USER_ROLES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  ALLOWED_INSPECTION_STATUS_TRANSITIONS,
} from '../config/constants.js';
import { logAuditEvent } from './auditService.js';
import { createNotification } from './notificationService.js';
import { issueVerificationCertificate } from './certificateService.js';
import { validateUploadedFile, processBase64Upload } from '../utils/fileSecurity.js';
import { runInTransaction } from '../utils/transactionHelper.js';

/**
 * Service: Start Field Inspection
 */
export async function startInspection(scheduleId, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users are not authorized to start official inspections.');
  }

  const schedule = await VerificationSchedule.findById(scheduleId)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder');

  if (!schedule) {
    throw ApiError.notFound('Verification schedule not found.');
  }

  // Check schedule validity
  if (schedule.status === SCHEDULE_STATUSES.CANCELLED) {
    throw ApiError.badRequest('Cannot start inspection for a cancelled schedule.');
  }

  if (schedule.status === SCHEDULE_STATUSES.COMPLETED) {
    throw ApiError.badRequest('Cannot start inspection for an already completed schedule.');
  }

  // Check officer assignment authorization
  const isAssignedOfficer =
    String(schedule.assignedOfficer?._id || schedule.assignedOfficer) === String(user._id);
  const isAssignedFieldOfficer =
    schedule.assignedFieldOfficer &&
    String(schedule.assignedFieldOfficer?._id || schedule.assignedFieldOfficer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssignedOfficer && !isAssignedFieldOfficer && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to inspect this schedule.');
  }

  // Application must exist and be in scheduled/approved/inspection state
  const application = schedule.application;
  if (!application) {
    throw ApiError.notFound('Associated application not found.');
  }

  if (
    application.currentStatus !== APPLICATION_STATUSES.APPROVED &&
    application.currentStatus !== APPLICATION_STATUSES.SCHEDULED &&
    application.currentStatus !== APPLICATION_STATUSES.INSPECTION
  ) {
    throw ApiError.badRequest(
      `Cannot start inspection on application in '${application.currentStatus}' state. Must be APPROVED, SCHEDULED, or INSPECTION.`
    );
  }

  // Prevent duplicate active inspection for this schedule
  const existingActiveInspection = await VerificationInspection.findOne({
    schedule: schedule._id,
    inspectionStatus: {
      $in: [
        INSPECTION_STATUSES.DRAFT,
        INSPECTION_STATUSES.IN_PROGRESS,
        INSPECTION_STATUSES.SUBMITTED,
        INSPECTION_STATUSES.UNDER_REVIEW,
      ],
    },
  });

  if (existingActiveInspection) {
    throw ApiError.conflict('An active inspection is already in progress for this schedule.');
  }

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const inspectionNumber = `INSP-${new Date().getFullYear()}-${randomSuffix}`;

  const inspection = new VerificationInspection({
    inspectionNumber,
    schedule: schedule._id,
    application: application._id,
    instrument: schedule.instrument._id || schedule.instrument,
    stakeholder: schedule.stakeholder?._id || schedule.stakeholder,
    assignedOfficer: user._id,
    officer: user._id, // backward compatibility
    verificationCenter: schedule.verificationCenter,
    gatc: schedule.gatc,
    location: schedule.locationAddress || 'Field inspection site',
    startTime: new Date(),
    inspectionDate: new Date(),
    inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
    createdBy: user._id,
    updatedBy: user._id,
  });

  await inspection.save();

  // Update schedule status to IN_PROGRESS
  schedule.status = SCHEDULE_STATUSES.IN_PROGRESS;
  await schedule.save();

  // Update application status to INSPECTION if not already there
  if (application.currentStatus !== APPLICATION_STATUSES.INSPECTION) {
    const fromStatus = application.currentStatus;
    application.currentStatus = APPLICATION_STATUSES.INSPECTION;
    application.statusHistory.push({
      fromStatus,
      toStatus: APPLICATION_STATUSES.INSPECTION,
      changedBy: user._id,
      remarks: 'Field metrological testing and verification inspection commenced',
      timestamp: new Date(),
    });
    await application.save();
  }

  // Audit Log
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_STARTED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      scheduleId: schedule._id,
      applicationNumber: application.applicationNumber,
    },
  });

  return inspection;
}

/**
 * Service: Save or Update Inspection Draft
 */
export async function saveInspectionDraft(inspectionId, data, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users cannot modify inspection data.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Authorization check
  const isAssigned =
    String(inspection.assignedOfficer) === String(user._id) ||
    String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to update this inspection.');
  }

  // Immutability: finalized records cannot be edited freely
  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest('Finalized inspection records are immutable and cannot be modified.');
  }

  // Validate coordinates if provided
  if (data.latitude !== undefined && data.latitude !== null) {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw ApiError.badRequest('Latitude must be a valid number between -90 and 90.');
    }
    inspection.latitude = lat;
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    const lon = Number(data.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      throw ApiError.badRequest('Longitude must be a valid number between -180 and 180.');
    }
    inspection.longitude = lon;
  }

  if (data.gpsCoordinates) {
    const { latitude, longitude, accuracyMeters, address } = data.gpsCoordinates;
    if (latitude !== undefined) {
      const lat = Number(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw ApiError.badRequest('GPS latitude must be between -90 and 90.');
      }
    }
    if (longitude !== undefined) {
      const lon = Number(longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        throw ApiError.badRequest('GPS longitude must be between -180 and 180.');
      }
    }
    inspection.gpsCoordinates = {
      latitude: latitude !== undefined ? Number(latitude) : inspection.gpsCoordinates?.latitude,
      longitude: longitude !== undefined ? Number(longitude) : inspection.gpsCoordinates?.longitude,
      accuracyMeters: accuracyMeters !== undefined ? Number(accuracyMeters) : inspection.gpsCoordinates?.accuracyMeters,
      address: address || inspection.gpsCoordinates?.address,
    };
    if (latitude !== undefined) inspection.latitude = Number(latitude);
    if (longitude !== undefined) inspection.longitude = Number(longitude);
  }

  // Validate instrumentReadings if provided
  if (data.instrumentReadings) {
    if (!Array.isArray(data.instrumentReadings)) {
      throw ApiError.badRequest('instrumentReadings must be an array.');
    }
    for (const r of data.instrumentReadings) {
      if (!r.testName || typeof r.testName !== 'string') {
        throw ApiError.badRequest('Each reading requires a valid testName.');
      }
      if (typeof r.standardValue !== 'number' || isNaN(r.standardValue)) {
        throw ApiError.badRequest('Each reading standardValue must be a valid number.');
      }
      if (typeof r.observedValue !== 'number' || isNaN(r.observedValue)) {
        throw ApiError.badRequest('Each reading observedValue must be a valid number.');
      }
      r.deviation = Number((r.observedValue - r.standardValue).toFixed(6));
    }
    inspection.instrumentReadings = data.instrumentReadings;
  }

  if (data.accuracyChecks) {
    if (!Array.isArray(data.accuracyChecks)) {
      throw ApiError.badRequest('accuracyChecks must be an array.');
    }
    inspection.accuracyChecks = data.accuracyChecks;
  }

  if (data.complianceChecks) {
    if (!Array.isArray(data.complianceChecks)) {
      throw ApiError.badRequest('complianceChecks must be an array.');
    }
    inspection.complianceChecks = data.complianceChecks;
  }

  if (data.defects) {
    if (!Array.isArray(data.defects)) {
      throw ApiError.badRequest('defects must be an array.');
    }
    inspection.defects = data.defects;
  }

  if (data.observations !== undefined) inspection.observations = data.observations;
  if (data.inspectorRemarks !== undefined) inspection.inspectorRemarks = data.inspectorRemarks;
  if (data.stakeholderRemarks !== undefined) inspection.stakeholderRemarks = data.stakeholderRemarks;
  if (data.remarks !== undefined) inspection.remarks = data.remarks;
  if (data.instrumentCondition !== undefined) {
    inspection.instrumentCondition = {
      ...inspection.instrumentCondition?.toObject?.(),
      ...data.instrumentCondition,
    };
  }
  if (data.standardReference !== undefined) inspection.standardReference = data.standardReference;
  if (data.standardsUsed !== undefined) inspection.standardsUsed = data.standardsUsed;
  if (data.stampingAndSealing !== undefined) {
    inspection.stampingAndSealing = {
      ...inspection.stampingAndSealing?.toObject?.(),
      ...data.stampingAndSealing,
    };
  }
  if (data.nonCompliance !== undefined) inspection.nonCompliance = data.nonCompliance;
  if (data.location !== undefined) inspection.location = data.location;

  inspection.updatedBy = user._id;
  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_DRAFT_SAVED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
    },
  });

  return inspection;
}

/**
 * Service: Submit Inspection for Review / Finalization
 */
export async function submitInspection(inspectionId, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users cannot submit inspection records.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Authorization check
  const isAssigned =
    String(inspection.assignedOfficer) === String(user._id) ||
    String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to submit this inspection.');
  }

  // Prevent duplicate submission or submitting finalized inspection
  if (inspection.inspectionStatus === INSPECTION_STATUSES.SUBMITTED) {
    throw ApiError.badRequest('Inspection is already submitted.');
  }

  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest('Cannot submit an already finalized inspection.');
  }

  // Validate mandatory content before submission
  const hasObservations = Boolean(inspection.observations && inspection.observations.trim().length > 0);
  const hasReadings = Boolean(
    (inspection.instrumentReadings && inspection.instrumentReadings.length > 0) ||
    (inspection.measurementReadings && inspection.measurementReadings.length > 0)
  );
  const hasChecks = Boolean(
    (inspection.accuracyChecks && inspection.accuracyChecks.length > 0) ||
    (inspection.complianceChecks && inspection.complianceChecks.length > 0)
  );

  if (!hasObservations && !hasReadings && !hasChecks) {
    throw ApiError.badRequest(
      'Inspection submission requires at least one measurement reading, compliance check, or observation.'
    );
  }

  inspection.inspectionStatus = INSPECTION_STATUSES.SUBMITTED;
  inspection.submittedAt = new Date();
  inspection.endTime = new Date();
  inspection.updatedBy = user._id;

  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_SUBMITTED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
    },
  });

  return inspection;
}

/**
 * Service: Finalize Inspection Result (Verdict: VERIFIED or REJECTED)
 */
export async function finalizeInspection(inspectionId, payload, user) {
  // Only SUPER_ADMIN, ADMIN, or LEGAL_METROLOGY_OFFICER can finalize verification verdicts
  const allowedRoles = [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
  ];

  if (!allowedRoles.includes(user.role)) {
    throw ApiError.forbidden(
      'You are not authorized to finalize official verification results. Requires LEGAL_METROLOGY_OFFICER or ADMIN.'
    );
  }

  const inspection = await VerificationInspection.findById(inspectionId)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder');

  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Officer assignment and jurisdiction authorization check
  if (user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    const isAssigned =
      String(inspection.assignedOfficer?._id || inspection.assignedOfficer) === String(user._id) ||
      String(inspection.officer?._id || inspection.officer) === String(user._id) ||
      (inspection.application &&
        String(inspection.application.assignedLMO?._id || inspection.application.assignedLMO) === String(user._id));

    const officerDistrict = user.jurisdiction?.district;
    const stakeholderDistrict = inspection.stakeholder?.registeredAddress?.district;
    const isSameDistrict =
      officerDistrict &&
      stakeholderDistrict &&
      officerDistrict.toLowerCase() === stakeholderDistrict.toLowerCase();

    if (!isAssigned && !isSameDistrict) {
      throw ApiError.forbidden(
        'You are not authorized to finalize inspections assigned to another officer outside your jurisdiction.'
      );
    }
  }

  // Cannot re-finalize an already finalized inspection without reopening
  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest(
      'Inspection is already finalized. To alter official results, use the administrative reopen procedure.'
    );
  }

  const {
    result,
    reason,
    observations,
    defects,
    correctiveAction,
    officerRemarks,
    complianceInformation,
  } = payload;

  const verdict = result || payload.verdict;

  if (
    verdict !== INSPECTION_RESULTS.VERIFIED &&
    verdict !== INSPECTION_RESULTS.REJECTED &&
    verdict !== VERIFICATION_VERDICTS.PASS &&
    verdict !== VERIFICATION_VERDICTS.FAIL
  ) {
    throw ApiError.badRequest("Invalid result. Must be 'VERIFIED' or 'REJECTED' (or 'PASS' / 'FAIL').");
  }

  const isPassed =
    verdict === INSPECTION_RESULTS.VERIFIED || verdict === VERIFICATION_VERDICTS.PASS;

  // Rejection requires a reason
  if (!isPassed && (!reason || reason.trim().length === 0)) {
    throw ApiError.badRequest('Rejection reason is required for failed verification.');
  }

  const now = new Date();
  const nextDueDate = new Date(now);
  nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
  nextDueDate.setDate(nextDueDate.getDate() - 1);

  const application = inspection.application;
  const instrument = inspection.instrument;

  let generatedCertificate = null;

  await runInTransaction(async (session) => {
    if (isPassed) {
      // 1. Mark Inspection as PASSED
      inspection.inspectionStatus = INSPECTION_STATUSES.PASSED;
      inspection.result = INSPECTION_RESULTS.VERIFIED;
      inspection.verifiedBy = user._id;
      inspection.verifiedAt = now;
      inspection.resultRemarks = officerRemarks || 'Instrument verified compliant with statutory tolerances.';

      // 2. Mark Application as VERIFIED
      if (application) {
        application.currentStatus = APPLICATION_STATUSES.VERIFIED;
        application.statusHistory.push({
          fromStatus: APPLICATION_STATUSES.INSPECTION,
          toStatus: APPLICATION_STATUSES.VERIFIED,
          changedBy: user._id,
          remarks: 'Instrument passed statutory verification and MPE tests',
          timestamp: now,
        });
        await application.save(session ? { session } : undefined);
      }

      // 3. Mark Instrument as ACTIVE_VERIFIED
      if (instrument) {
        await Instrument.findByIdAndUpdate(
          instrument._id || instrument,
          { status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED },
          session ? { session } : undefined
        );
      }

      // 4. Mark Schedule as COMPLETED
      if (inspection.schedule) {
        await VerificationSchedule.findByIdAndUpdate(
          inspection.schedule,
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : undefined
        );
      }
      if (application) {
        await VerificationSchedule.updateMany(
          { application: application._id || application },
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : undefined
        );
      }

      // 5. Create or update VerificationResult
      const vrQuery = VerificationResult.findOne({ application: application._id });
      if (session) vrQuery.session(session);
      let verificationResultDoc = await vrQuery;

      if (!verificationResultDoc) {
        verificationResultDoc = new VerificationResult({
          application: application._id,
          inspection: inspection._id,
          instrument: instrument._id || instrument,
          result: VERIFICATION_VERDICTS.PASS,
          complianceInformation: complianceInformation || {
            allMpeCompliant: true,
            statutorySealAffixed: true,
          },
          officerRemarks: officerRemarks || 'Passed verification',
          verifiedBy: user._id,
          verificationDate: now,
          nextDueDate,
        });
      } else {
        verificationResultDoc.result = VERIFICATION_VERDICTS.PASS;
        verificationResultDoc.verifiedBy = user._id;
        verificationResultDoc.verificationDate = now;
        verificationResultDoc.nextDueDate = nextDueDate;
        verificationResultDoc.complianceInformation = complianceInformation || {
          allMpeCompliant: true,
          statutorySealAffixed: true,
        };
        verificationResultDoc.officerRemarks = officerRemarks || 'Passed verification';
      }
      await verificationResultDoc.save(session ? { session } : undefined);
    } else {
      // FAILED / REJECTED Verification
      inspection.inspectionStatus = INSPECTION_STATUSES.FAILED;
      inspection.result = INSPECTION_RESULTS.REJECTED;
      inspection.verifiedBy = user._id;
      inspection.verifiedAt = now;
      inspection.resultRemarks = reason;

      // 1. Mark Application as FAILED
      if (application) {
        application.currentStatus = APPLICATION_STATUSES.FAILED;
        application.statusHistory.push({
          fromStatus: APPLICATION_STATUSES.INSPECTION,
          toStatus: APPLICATION_STATUSES.FAILED,
          changedBy: user._id,
          remarks: `Verification failed: ${reason}`,
          timestamp: now,
        });
        await application.save(session ? { session } : undefined);
      }

      // 2. Mark Instrument as REJECTED
      if (instrument) {
        await Instrument.findByIdAndUpdate(
          instrument._id || instrument,
          { status: INSTRUMENT_STATUSES.REJECTED },
          session ? { session } : undefined
        );
      }

      // 3. Mark Schedule as COMPLETED
      if (inspection.schedule) {
        await VerificationSchedule.findByIdAndUpdate(
          inspection.schedule,
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : undefined
        );
      }

      // 4. Create or update VerificationResult with REJECTED
      const vrQuery = VerificationResult.findOne({ application: application._id });
      if (session) vrQuery.session(session);
      let verificationResultDoc = await vrQuery;

      if (!verificationResultDoc) {
        verificationResultDoc = new VerificationResult({
          application: application._id,
          inspection: inspection._id,
          instrument: instrument._id || instrument,
          result: VERIFICATION_VERDICTS.FAIL,
          complianceInformation: complianceInformation || {
            allMpeCompliant: false,
            statutorySealAffixed: false,
          },
          rejectionReasons: [reason],
          officerRemarks: officerRemarks || reason,
          verifiedBy: user._id,
          verificationDate: now,
          nextDueDate,
        });
      } else {
        verificationResultDoc.result = VERIFICATION_VERDICTS.FAIL;
        verificationResultDoc.rejectionReasons = [reason];
        verificationResultDoc.officerRemarks = officerRemarks || reason;
        verificationResultDoc.verifiedBy = user._id;
        verificationResultDoc.verificationDate = now;
        verificationResultDoc.complianceInformation = complianceInformation || {
          allMpeCompliant: false,
          statutorySealAffixed: false,
        };
      }
      await verificationResultDoc.save(session ? { session } : undefined);
    }

    await inspection.save(session ? { session } : undefined);

    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.INSPECTION_FINALIZED,
      entity: 'VerificationInspection',
      entityId: inspection._id,
      metadata: {
        inspectionNumber: inspection.inspectionNumber,
        verdict: isPassed ? 'VERIFIED' : 'REJECTED',
        reason: isPassed ? undefined : reason,
        certificateNumber: generatedCertificate?.certificateNumber,
      },
    }, session);
  });

  // Post-commit notifications
  if (inspection.stakeholder?.user) {
    if (isPassed) {
      await createNotification({
        recipient: inspection.stakeholder.user,
        type: NOTIFICATION_TYPES.VERIFICATION_PASSED,
        title: 'Verification Approved',
        message: `Your instrument under application ${application.applicationNumber} has been verified successfully and is eligible for digital certificate generation.`,
        relatedEntityType: 'Inspection',
        relatedEntityId: inspection._id,
        link: `/applications/${application._id}`,
      });
    } else {
      await createNotification({
        recipient: inspection.stakeholder.user,
        type: NOTIFICATION_TYPES.VERIFICATION_FAILED,
        title: 'Instrument Verification Test Failed',
        message: `Your instrument under application ${application.applicationNumber} did not meet statutory tolerances. Reason: ${reason}`,
        relatedEntityType: 'Inspection',
        relatedEntityId: inspection._id,
        link: `/applications/${application._id}`,
      });
    }
  }

  return {
    inspection,
    verdict: isPassed ? 'VERIFIED' : 'REJECTED',
    certificate: generatedCertificate,
  };
}

/**
 * Service: Administrative Reopen of Finalized Inspection
 */
export async function reopenInspection(inspectionId, reason, user) {
  if (user.role !== USER_ROLES.SUPER_ADMIN && user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden('Only administrative roles can reopen finalized inspections.');
  }

  if (!reason || reason.trim().length === 0) {
    throw ApiError.badRequest('A justification reason is required to reopen an inspection.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  if (
    inspection.inspectionStatus !== INSPECTION_STATUSES.PASSED &&
    inspection.inspectionStatus !== INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest(
      `Cannot reopen inspection in '${inspection.inspectionStatus}' status. Must be PASSED or FAILED.`
    );
  }

  const previousStatus = inspection.inspectionStatus;
  inspection.inspectionStatus = INSPECTION_STATUSES.UNDER_REVIEW;
  inspection.updatedBy = user._id;
  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_REOPENED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      previousStatus,
      reopenReason: reason,
    },
  });

  return inspection;
}

/**
 * Service: Upload Photographic / Document Evidence
 */
export async function uploadEvidence(inspectionId, file, caption, user, options = {}) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users cannot upload official inspection evidence.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  const isAssigned =
    String(inspection.assignedOfficer) === String(user._id) ||
    String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to upload evidence for this inspection.');
  }

  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest('Cannot add evidence to a finalized inspection.');
  }

  let fileUrl;
  if (file && typeof file === 'object' && file.filename) {
    await validateUploadedFile(file);
    fileUrl = `/uploads/instrument-photos/${file.filename}`;
  } else if (file && typeof file === 'string') {
    if (file.startsWith('/uploads/')) {
      fileUrl = file;
    } else {
      const processed = await processBase64Upload(file, 'instrument-photos');
      fileUrl = processed.fileUrl;
    }
  } else {
    throw ApiError.badRequest('Invalid or missing file data.');
  }

  const photoEntry = {
    caption: caption || 'Field Test Verification Evidence',
    fileUrl,
    url: fileUrl,
    latitude: options.latitude,
    longitude: options.longitude,
    uploadedAt: new Date(),
  };

  inspection.photographs.push(photoEntry);
  inspection.photos.push(photoEntry); // backward compat
  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_EVIDENCE_UPLOADED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      fileUrl,
    },
  });

  return {
    ...photoEntry,
    photographs: inspection.photographs,
    photos: inspection.photos,
    inspection,
  };
}

/**
 * Service: Get Single Inspection Details with Strict Security
 */
export async function getInspectionById(inspectionId, user) {
  const inspection = await VerificationInspection.findById(inspectionId)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder')
    .populate('assignedOfficer', 'name email phone designation jurisdiction')
    .populate('verificationCenter', 'centerName centerCode address')
    .populate('gatc', 'gatcName gatcCode')
    .populate('verifiedBy', 'name email designation');

  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Security: Business User data isolation
  if (user.role === USER_ROLES.BUSINESS_USER) {
    const userStakeholder = await Stakeholder.findOne({ user: user._id });
    if (
      !userStakeholder ||
      String(inspection.stakeholder?._id || inspection.stakeholder) !== String(userStakeholder._id)
    ) {
      throw ApiError.forbidden('You are not authorized to view this inspection record.');
    }
  } else if (
    user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
    user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    // Officers can only access inspections assigned to them or within authorized jurisdiction
    const isAssigned =
      String(inspection.assignedOfficer?._id || inspection.assignedOfficer) === String(user._id) ||
      String(inspection.officer?._id || inspection.officer) === String(user._id);

    if (!isAssigned) {
      throw ApiError.forbidden('You are not authorized to view inspections assigned to other officers.');
    }
  }

  return inspection;
}

/**
 * Service: List Inspections with Filters & Pagination
 */
export async function listInspections(query, user) {
  const filter = {};

  if (user.role === USER_ROLES.BUSINESS_USER) {
    const userStakeholder = await Stakeholder.findOne({ user: user._id });
    if (!userStakeholder) {
      return { inspections: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
    }
    filter.stakeholder = userStakeholder._id;
  } else if (
    user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
    user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    if (query.all !== 'true' || user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
      filter.$or = [
        { assignedOfficer: user._id },
        { officer: user._id },
      ];
    }
  }

  if (query.status) {
    filter.inspectionStatus = query.status;
  }

  if (query.result) {
    filter.result = query.result;
  }

  if (query.inspectionNumber) {
    filter.inspectionNumber = { $regex: query.inspectionNumber, $options: 'i' };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [inspections, total] = await Promise.all([
    VerificationInspection.find(filter)
      .populate('application', 'applicationNumber applicationType currentStatus')
      .populate('instrument', 'instrumentId category instrumentType manufacturer modelNumber')
      .populate('stakeholder', 'businessName')
      .populate('assignedOfficer', 'name email designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VerificationInspection.countDocuments(filter),
  ]);

  return {
    inspections,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Service: Get Real Officer Dashboard Inspection Metrics (Zero dummy data)
 */
export async function getOfficerDashboardMetrics(user) {
  const filter = {};

  if (
    user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
    user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    filter.$or = [
      { assignedOfficer: user._id },
      { officer: user._id },
    ];
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalInspections,
    todayInspections,
    inProgressInspections,
    submittedInspections,
    passedInspections,
    failedInspections,
  ] = await Promise.all([
    VerificationInspection.countDocuments(filter),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionDate: { $gte: startOfToday, $lte: endOfToday },
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.SUBMITTED,
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.PASSED,
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.FAILED,
    }),
  ]);

  return {
    totalInspections,
    todayInspections,
    pendingInspections: inProgressInspections + submittedInspections,
    inProgressInspections,
    submittedInspections,
    passedInspections,
    failedInspections,
    completedInspections: passedInspections + failedInspections,
  };
}
