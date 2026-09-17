import { VerificationResult } from '../models/VerificationResult.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Instrument } from '../models/Instrument.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  APPLICATION_STATUSES,
  INSTRUMENT_STATUSES,
  VERIFICATION_VERDICTS,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
} from '../config/constants.js';
import { issueVerificationCertificate } from '../services/certificateService.js';
import { logAuditEvent } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export const submitVerificationVerdict = asyncHandler(async (req, res) => {
  const {
    applicationId,
    inspectionId,
    verdict,
    complianceInformation,
    rejectionReasons,
    officerRemarks,
  } = req.body;

  const application = await VerificationApplication.findById(applicationId).populate('stakeholder');
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found');
  }

  const vDate = new Date();
  const nextDueDate = new Date(vDate);
  nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
  nextDueDate.setDate(nextDueDate.getDate() - 1);

  // Check if result already recorded
  let result = await VerificationResult.findOne({ application: application._id });

  if (result) {
    result.verdict = verdict;
    result.complianceInformation = complianceInformation;
    result.rejectionReasons = rejectionReasons;
    result.officerRemarks = officerRemarks;
    result.verifiedBy = req.user._id;
    result.verificationDate = vDate;
    result.nextDueDate = nextDueDate;
  } else {
    result = new VerificationResult({
      application: application._id,
      inspection: inspection._id,
      instrument: application.instrument,
      result: verdict,
      complianceInformation,
      rejectionReasons,
      officerRemarks,
      verifiedBy: req.user._id,
      verificationDate: vDate,
      nextDueDate,
    });
  }

  await result.save();

  let generatedCertificate = null;

  if (verdict === VERIFICATION_VERDICTS.PASS) {
    // 1. Move application to VERIFIED
    application.currentStatus = APPLICATION_STATUSES.VERIFIED;
    application.statusHistory.push({
      fromStatus: APPLICATION_STATUSES.INSPECTION,
      toStatus: APPLICATION_STATUSES.VERIFIED,
      changedBy: req.user._id,
      remarks: 'Instrument passed all statutory verification tests and MPE tolerances',
      timestamp: vDate,
    });
    await application.save();

    // 2. Automatically generate Digital Certificate & QR
    generatedCertificate = await issueVerificationCertificate({
      applicationId: application._id,
      officerId: req.user._id,
      verificationDate: vDate,
    });
  } else {
    // FAILED verification
    application.currentStatus = APPLICATION_STATUSES.FAILED;
    application.statusHistory.push({
      fromStatus: APPLICATION_STATUSES.INSPECTION,
      toStatus: APPLICATION_STATUSES.FAILED,
      changedBy: req.user._id,
      remarks: `Verification failed: ${rejectionReasons?.join(', ') || officerRemarks}`,
      timestamp: vDate,
    });
    await application.save();

    // Mark instrument as REJECTED
    await Instrument.findByIdAndUpdate(application.instrument, {
      status: INSTRUMENT_STATUSES.REJECTED,
    });

    // Notify Stakeholder
    if (application.stakeholder?.user) {
      await createNotification({
        recipientId: application.stakeholder.user,
        type: NOTIFICATION_TYPES.APPLICATION_REJECTED,
        title: 'Instrument Verification Test Failed',
        message: `Your instrument under application ${application.applicationNumber} did not meet statutory MPE limits. Rectification required.`,
        link: `/applications/${application._id}`,
      });
    }
  }

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.VERIFICATION_RESULT_CREATED,
    entity: 'VerificationResult',
    entityId: result._id,
    metadata: {
      applicationNumber: application.applicationNumber,
      verdict,
      certificateNumber: generatedCertificate?.certificateNumber,
    },
  });

  return ApiResponse.created(
    res,
    {
      result,
      certificate: generatedCertificate,
    },
    verdict === VERIFICATION_VERDICTS.PASS
      ? 'Verification passed and official certificate generated successfully'
      : 'Verification recorded as failed'
  );
});

export const getResultByApplicationId = asyncHandler(async (req, res) => {
  const result = await VerificationResult.findOne({ application: req.params.applicationId })
    .populate('verifiedBy', 'name email designation jurisdiction')
    .populate('inspection');

  if (!result) {
    throw ApiError.notFound('Verification result not found for this application');
  }

  return ApiResponse.success(res, result, 'Verification result retrieved');
});
