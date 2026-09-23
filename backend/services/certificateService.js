import crypto from 'crypto';
import { Certificate } from '../models/Certificate.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Instrument } from '../models/Instrument.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { generateVerificationQR } from './qrService.js';
import { generateCertificatePDF } from './pdfService.js';
import { createNotification } from './notificationService.js';
import { logAuditEvent } from './auditService.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import {
  APPLICATION_STATUSES,
  INSTRUMENT_STATUSES,
  CERTIFICATE_STATUSES,
  INSPECTION_STATUSES,
  INSPECTION_RESULTS,
  VERIFICATION_VERDICTS,
  USER_ROLES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
} from '../config/constants.js';
import { ENV } from '../config/env.js';

/**
 * Evaluates dynamic status of a certificate based on validity period and revocation status
 */
export function getDynamicStatus(certificate) {
  if (
    certificate.certificateStatus === CERTIFICATE_STATUSES.REVOKED ||
    certificate.status === CERTIFICATE_STATUSES.REVOKED
  ) {
    return CERTIFICATE_STATUSES.REVOKED;
  }
  if (
    certificate.certificateStatus === CERTIFICATE_STATUSES.CANCELLED ||
    certificate.status === CERTIFICATE_STATUSES.CANCELLED
  ) {
    return CERTIFICATE_STATUSES.CANCELLED;
  }
  if (new Date() > new Date(certificate.validUntil)) {
    return CERTIFICATE_STATUSES.EXPIRED;
  }
  return CERTIFICATE_STATUSES.ACTIVE;
}

/**
 * Generates an official Digital Legal Metrology Certificate for a finalized PASSED/VERIFIED inspection
 * POST /api/certificates/generate/:inspectionId
 */
export async function generateCertificateForInspection({ inspectionId, user }) {
  // 1. Role validation: Must be Legal Metrology Officer or Administrator
  const allowedRoles = [
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
  ];
  if (!user || !allowedRoles.includes(user.role)) {
    throw ApiError.forbidden('You are not authorized to generate verification certificates.');
  }

  // 2. Fetch and validate Inspection record
  if (!inspectionId) {
    throw ApiError.badRequest('Inspection ID is required.');
  }

  const inspection = await VerificationInspection.findById(inspectionId)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder');

  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // 3. Inspection MUST be finalized
  const isFinalized =
    inspection.isFinalized ||
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED;

  if (!isFinalized) {
    throw ApiError.badRequest('Inspection is not finalized. Cannot generate certificate for unfinalized inspection.');
  }

  // 4. Inspection result MUST be PASSED / VERIFIED
  const isPassed =
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.result === INSPECTION_RESULTS.VERIFIED ||
    inspection.result === VERIFICATION_VERDICTS.PASS;

  if (!isPassed) {
    throw ApiError.badRequest('Cannot generate verification certificate for a failed or rejected inspection.');
  }

  // 5. Ensure relationships exist
  const application = inspection.application;
  const instrument = inspection.instrument;
  const stakeholder = inspection.stakeholder;

  if (!application || !instrument || !stakeholder) {
    throw ApiError.badRequest('Inspection record is missing linked application, instrument, or stakeholder entity.');
  }

  // 6. Prevent duplicate certificate generation
  const existingCertificate = await Certificate.findOne({
    $or: [{ inspection: inspection._id }, { application: application._id }],
  });

  if (existingCertificate) {
    const status = getDynamicStatus(existingCertificate);
    if (status !== CERTIFICATE_STATUSES.REVOKED && status !== CERTIFICATE_STATUSES.CANCELLED) {
      throw ApiError.badRequest(
        `A verification certificate (${existingCertificate.certificateNumber}) has already been issued for this inspection.`
      );
    }
  }

  // 7. Calculate statutory dates
  const issuedAt = new Date();
  const validFrom = new Date(inspection.finalizedAt || inspection.inspectionDate || issuedAt);
  const validUntil = new Date(validFrom);
  const intervalMonths = instrument.verificationIntervalMonths || 12;
  validUntil.setMonth(validUntil.getMonth() + intervalMonths);
  validUntil.setDate(validUntil.getDate() - 1);

  // 8. Generate unique certificate number: LM-CERT-YYYY-XXXXXX-XXXX
  const year = validFrom.getFullYear();
  const certCount = await Certificate.countDocuments();
  const paddedIndex = String(certCount + 1).padStart(5, '0');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const certificateNumber = `LM-CERT-${year}-${paddedIndex}-${randomSuffix}`;

  // 9. Generate cryptographically secure QR verification token (64 hex characters)
  const qrToken = crypto.randomBytes(32).toString('hex');

  // 10. Generate tamper-evident SHA-256 digest
  const hashPayload = `${certificateNumber}|${application.applicationNumber || application._id}|${instrument.instrumentId || instrument.serialNumber}|${stakeholder.tradeLicenseNumber || stakeholder._id}|${validFrom.toISOString()}|${validUntil.toISOString()}|${user._id}`;
  const tamperEvidentHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  // 11. Generate QR Code pointing to public verification endpoint
  const { publicVerificationUrl, qrDataUrl } = await generateVerificationQR(qrToken);

  // 12. Generate official PDF certificate document
  const pdfResult = await generateCertificatePDF({
    certificateNumber,
    applicationNumber: application.applicationNumber,
    stakeholder,
    instrument,
    verificationDate: validFrom,
    validUntil,
    verificationResult: 'VERIFIED (PASS)',
    officer: user,
    qrDataUrl,
    qrToken,
    verificationUrl: publicVerificationUrl,
    tamperEvidentHash,
  });

  // 13. Create Certificate in MongoDB
  const certificate = new Certificate({
    certificateNumber,
    application: application._id,
    inspection: inspection._id,
    instrument: instrument._id,
    stakeholder: stakeholder._id,
    issuedBy: user._id,
    issuedByOfficer: user._id,
    issuedAt,
    verificationDate: validFrom,
    validFrom,
    validUntil,
    verificationType: application.applicationType || 'INITIAL_VERIFICATION',
    result: 'VERIFIED',
    certificateStatus: CERTIFICATE_STATUSES.ACTIVE,
    status: CERTIFICATE_STATUSES.ACTIVE,
    certificateUrl: pdfResult.relativeUrl,
    certificatePdfPath: pdfResult.relativeUrl,
    pdfUrl: pdfResult.relativeUrl,
    qrToken,
    qrVerificationToken: qrToken,
    qrCodeToken: qrToken,
    qrUrl: publicVerificationUrl,
    qrCodeDataUrl: qrDataUrl,
    tamperEvidentHash,
    cryptographicHash: tamperEvidentHash,
    issuingAuthority: 'Department of Consumer Affairs, Legal Metrology Division, Government of India',
  });

  await runInTransaction(async (session) => {
    await certificate.save(session ? { session } : undefined);

    // 14. Update Application status to CERTIFICATE_GENERATED
    application.currentStatus = APPLICATION_STATUSES.CERTIFICATE_GENERATED;
    application.statusHistory.push({
      fromStatus: APPLICATION_STATUSES.VERIFIED,
      toStatus: APPLICATION_STATUSES.CERTIFICATE_GENERATED,
      changedBy: user._id,
      remarks: `Digital certificate ${certificateNumber} generated.`,
      timestamp: new Date(),
    });
    await application.save(session ? { session } : undefined);

    // 15. Update Instrument status and verification due date
    await Instrument.findByIdAndUpdate(
      instrument._id,
      {
        status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
        lastVerificationDate: validFrom,
        nextVerificationDueDate: validUntil,
      },
      session ? { session } : undefined
    );

    // 15b. Prevent old expiry notifications from continuing unnecessarily
    await Notification.updateMany(
      {
        instrument: instrument._id,
        type: {
          $in: [
            NOTIFICATION_TYPES.VERIFICATION_REMINDER,
            NOTIFICATION_TYPES.VERIFICATION_WARNING,
            NOTIFICATION_TYPES.VERIFICATION_URGENT,
            NOTIFICATION_TYPES.VERIFICATION_EXPIRED,
            NOTIFICATION_TYPES.VERIFICATION_DUE,
            NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
          ],
        },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
          'metadata.supersededByReverification': true,
          'metadata.newCertificateNumber': certificateNumber,
        },
      },
      session ? { session } : undefined
    );

    // 16. Record Audit Log
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.CERTIFICATE_GENERATED,
      entity: 'Certificate',
      entityId: certificate._id,
      metadata: {
        certificateNumber,
        inspectionId: inspection._id,
        applicationId: application._id,
        instrumentId: instrument._id,
        validUntil: validUntil.toISOString(),
      },
    }, session);
  });

  // 17. Send notification to Stakeholder (post-commit)
  const stakeholderRecord = await Stakeholder.findById(stakeholder._id).select('user businessName');
  if (stakeholderRecord?.user) {
    await createNotification({
      recipient: stakeholderRecord.user,
      type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
      title: 'Verification Certificate Issued',
      message: `Digital Certificate ${certificateNumber} has been issued for instrument ${instrument.instrumentId || instrument.serialNumber}. Valid until ${validUntil.toLocaleDateString('en-IN')}.`,
      relatedEntityType: 'Certificate',
      relatedEntityId: certificate._id,
      link: `/certificates/${certificate._id}`,
    });
  }

  return certificate;
}

/**
 * Revokes an existing certificate with statutory reason and audit trail
 * Only Administrator / Super Administrator can revoke certificates
 */
export async function revokeCertificate({ certificateId, user, reason }) {
  // Role authorization: Only ADMIN or SUPER_ADMIN
  const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
  if (!user || !allowedRoles.includes(user.role)) {
    throw ApiError.forbidden('Only Administrators are authorized to revoke verification certificates.');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw ApiError.badRequest('A specific statutory reason (minimum 5 characters) is required for certificate revocation.');
  }

  const certificate = await Certificate.findById(certificateId);
  if (!certificate) {
    throw ApiError.notFound('Certificate not found.');
  }

  if (
    certificate.certificateStatus === CERTIFICATE_STATUSES.REVOKED ||
    certificate.status === CERTIFICATE_STATUSES.REVOKED
  ) {
    throw ApiError.badRequest('Certificate is already marked as REVOKED.');
  }

  const now = new Date();
  certificate.certificateStatus = CERTIFICATE_STATUSES.REVOKED;
  certificate.status = CERTIFICATE_STATUSES.REVOKED;
  certificate.revokedAt = now;
  certificate.revokedBy = user._id;
  certificate.revocationReason = reason.trim();
  certificate.revocationDetails = {
    revokedAt: now,
    revokedBy: user._id,
    reason: reason.trim(),
  };

  await runInTransaction(async (session) => {
    await certificate.save(session ? { session } : undefined);

    // Update Instrument status to REJECTED
    await Instrument.findByIdAndUpdate(
      certificate.instrument,
      { status: INSTRUMENT_STATUSES.REJECTED },
      session ? { session } : undefined
    );

    // Record Audit Log
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.CERTIFICATE_REVOKED,
      entity: 'Certificate',
      entityId: certificate._id,
      metadata: {
        certificateNumber: certificate.certificateNumber,
        reason: reason.trim(),
        revokedAt: now.toISOString(),
      },
    }, session);
  });

  // Notify Stakeholder
  const stakeholder = await Stakeholder.findById(certificate.stakeholder).select('user businessName');
  if (stakeholder?.user) {
    await createNotification({
      recipient: stakeholder.user,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      title: 'Certificate Revoked',
      message: `Verification certificate ${certificate.certificateNumber} has been revoked by the Legal Metrology Department. Reason: ${reason.trim()}`,
      relatedEntityType: 'Certificate',
      relatedEntityId: certificate._id,
      link: `/certificates/${certificate._id}`,
    });
  }

  return certificate;
}

/**
 * Public Verification lookup by token or certificateNumber
 * Returns sanitized, non-confidential verification response
 */
export async function getPublicCertificateVerification(token) {
  if (!token) {
    throw ApiError.badRequest('Verification token is required.');
  }

  const certificate = await Certificate.findOne({
    $or: [
      { qrToken: token },
      { qrVerificationToken: token },
      { qrCodeToken: token },
      { certificateNumber: token },
    ],
  })
    .populate('application', 'applicationNumber')
    .populate('stakeholder', 'businessName tradeLicenseNumber registeredAddress')
    .populate(
      'instrument',
      'instrumentId category instrumentType manufacturer modelNumber serialNumber capacity accuracyClass verificationScaleInterval_e installationAddress'
    )
    .populate('issuedBy', 'name designation jurisdiction')
    .populate('issuedByOfficer', 'name designation jurisdiction');

  if (!certificate) {
    return null;
  }

  const dynamicStatus = getDynamicStatus(certificate);
  const isRevoked = dynamicStatus === CERTIFICATE_STATUSES.REVOKED;
  const isExpired = dynamicStatus === CERTIFICATE_STATUSES.EXPIRED;
  const isValid = dynamicStatus === CERTIFICATE_STATUSES.ACTIVE || dynamicStatus === CERTIFICATE_STATUSES.VALID;

  const officer = certificate.issuedBy || certificate.issuedByOfficer;
  const revocationReason = certificate.revocationReason || certificate.revocationDetails?.reason || null;

  // Recompute canonical SHA-256 tamper-evident digest dynamically using issuance parameters
  const app = certificate.application;
  const inst = certificate.instrument;
  const stk = certificate.stakeholder;
  const officerId = officer?._id || certificate.issuedBy || certificate.issuedByOfficer;

  const normCertNo = String(certificate.certificateNumber || '').trim();
  const normAppNo = String(app?.applicationNumber || app?._id || certificate.application || '').trim();
  const normInstId = String(inst?.instrumentId || inst?.serialNumber || certificate.instrument?._id || certificate.instrument || '').trim();
  const normTradeLicense = String(stk?.tradeLicenseNumber || stk?._id || certificate.stakeholder?._id || certificate.stakeholder || '').trim();
  const normValidFrom = certificate.validFrom ? new Date(certificate.validFrom).toISOString() : '';
  const normValidUntil = certificate.validUntil ? new Date(certificate.validUntil).toISOString() : '';
  const normOfficerId = String(officerId || '').trim();

  const hashPayload = `${normCertNo}|${normAppNo}|${normInstId}|${normTradeLicense}|${normValidFrom}|${normValidUntil}|${normOfficerId}`;
  const recalculatedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
  const storedHash = String(certificate.tamperEvidentHash || certificate.cryptographicHash || '').toLowerCase().trim();

  const integrityVerified = storedHash.length > 0 && storedHash === recalculatedHash.toLowerCase();
  const integrityStatus = integrityVerified ? 'VERIFIED_GENUINE' : 'DATA_ALTERED';

  return {
    _id: certificate._id,
    id: certificate._id,
    certificateNumber: certificate.certificateNumber,
    qrCodeToken: certificate.qrToken || certificate.qrVerificationToken,
    status: dynamicStatus,
    certificateStatus: dynamicStatus,
    isValid,
    isExpired,
    isRevoked,
    revocationReason: isRevoked ? revocationReason : null,
    verificationResult: certificate.result || 'VERIFIED',
    verificationDate: certificate.verificationDate || certificate.issuedAt,
    issuedAt: certificate.issuedAt,
    validFrom: certificate.validFrom,
    validUntil: certificate.validUntil,
    issuingAuthority: certificate.issuingAuthority,
    tamperEvidentHash: certificate.tamperEvidentHash || recalculatedHash,
    recalculatedHash,
    integrityVerified,
    integrityStatus,
    verificationUrl: certificate.qrUrl,
    stakeholder: {
      businessName: certificate.stakeholder?.businessName,
      tradeLicenseNumber: certificate.stakeholder?.tradeLicenseNumber,
      district: certificate.stakeholder?.registeredAddress?.district,
      state: certificate.stakeholder?.registeredAddress?.state,
    },
    instrument: {
      instrumentId: certificate.instrument?.instrumentId,
      category: certificate.instrument?.category,
      instrumentType: certificate.instrument?.instrumentType,
      manufacturer: certificate.instrument?.manufacturer,
      modelNumber: certificate.instrument?.modelNumber,
      serialNumber: certificate.instrument?.serialNumber,
      capacity: certificate.instrument?.capacity,
      accuracyClass: certificate.instrument?.accuracyClass,
      scaleInterval: certificate.instrument?.verificationScaleInterval_e,
      premiseLocation: certificate.instrument?.installationAddress?.premiseName,
    },
    officer: {
      name: officer?.name,
      designation: officer?.designation || 'Inspector of Legal Metrology',
      jurisdiction: officer?.jurisdiction?.district,
    },
    revocationDetails: isRevoked
      ? {
          revokedAt: certificate.revokedAt || certificate.revocationDetails?.revokedAt,
          reason: certificate.revocationReason || certificate.revocationDetails?.reason,
        }
      : null,
  };
}

/**
 * Backwards compatibility helper for issueVerificationCertificate
 */
export async function issueVerificationCertificate({
  applicationId,
  officerId,
  verificationDate = new Date(),
}) {
  const application = await VerificationApplication.findById(applicationId);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  // Find linked inspection
  const inspection = await VerificationInspection.findOne({
    application: applicationId,
  });

  const user = await User.findById(officerId);
  if (!user) {
    throw ApiError.notFound('Officer not found');
  }

  if (inspection) {
    return generateCertificateForInspection({
      inspectionId: inspection._id,
      user,
    });
  }

  // If no inspection doc yet, return existing or create minimal
  const existing = await Certificate.findOne({ application: applicationId });
  if (existing) return existing;

  throw ApiError.badRequest('No finalized inspection found for application.');
}
