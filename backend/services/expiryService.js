import { Certificate } from '../models/Certificate.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import {
  CERTIFICATE_STATUSES,
  DYNAMIC_CERTIFICATE_STATUSES,
  INSTRUMENT_DUE_STATUSES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  APPLICATION_STATUSES,
  USER_ROLES,
  AUDIT_ACTIONS,
} from '../config/constants.js';
import { ENV } from '../config/env.js';
import { createNotification } from './notificationService.js';
import { logAuditEvent } from './auditService.js';

/**
 * Dynamically resolves the lifecycle status of a Certificate.
 * Source of truth is Certificate.validUntil and revocation/cancellation flags.
 */
export function calculateCertificateDynamicStatus(
  certificate,
  expiringDays = 30,
  referenceDate = new Date()
) {
  if (!certificate) return null;

  const certStatus = certificate.certificateStatus || certificate.status;
  if (certStatus === CERTIFICATE_STATUSES.REVOKED || certificate.revokedAt) {
    return DYNAMIC_CERTIFICATE_STATUSES.REVOKED;
  }
  if (certStatus === CERTIFICATE_STATUSES.CANCELLED || certificate.cancelledAt) {
    return DYNAMIC_CERTIFICATE_STATUSES.CANCELLED;
  }
  if (!certificate.validUntil) {
    return certStatus || DYNAMIC_CERTIFICATE_STATUSES.ACTIVE;
  }

  const now = new Date(referenceDate);
  const validUntil = new Date(certificate.validUntil);

  if (validUntil.getTime() < now.getTime()) {
    return DYNAMIC_CERTIFICATE_STATUSES.EXPIRED;
  }

  const diffDays = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= expiringDays && diffDays >= 0) {
    return DYNAMIC_CERTIFICATE_STATUSES.EXPIRING_SOON;
  }

  return DYNAMIC_CERTIFICATE_STATUSES.ACTIVE;
}

/**
 * Dynamically resolves the verification due status of an Instrument.
 * Source of truth is Instrument.nextVerificationDueDate.
 */
export function calculateInstrumentDueStatus(
  instrument,
  reminderThresholdDays = 30,
  referenceDate = new Date()
) {
  if (!instrument || !instrument.nextVerificationDueDate) {
    return INSTRUMENT_DUE_STATUSES.UP_TO_DATE;
  }

  const now = new Date(referenceDate);
  const dueDate = new Date(instrument.nextVerificationDueDate);

  if (dueDate.getTime() < now.getTime()) {
    return INSTRUMENT_DUE_STATUSES.OVERDUE;
  }

  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= reminderThresholdDays && diffDays >= 0) {
    return INSTRUMENT_DUE_STATUSES.DUE_SOON;
  }

  return INSTRUMENT_DUE_STATUSES.UP_TO_DATE;
}

/**
 * Checks all non-revoked and non-cancelled certificates in MongoDB,
 * identifies expiring and expired certificates, and dispatches statutory notifications.
 */
export async function checkExpiringCertificates({
  reminderWindows = ENV.REMINDER_WINDOWS,
  now = new Date(),
} = {}) {
  const referenceDate = new Date(now);

  // Strictly exclude REVOKED and CANCELLED certificates
  const certificates = await Certificate.find({
    certificateStatus: {
      $nin: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED],
    },
    status: {
      $nin: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED],
    },
    revokedAt: null,
  }).populate({
    path: 'stakeholder',
    select: 'user businessName tradeLicenseNumber',
  });

  const summary = {
    totalChecked: certificates.length,
    activeCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    remindersSent: 0,
    duplicatesPrevented: 0,
    details: [],
  };

  const sortedWindows = [...reminderWindows].sort((a, b) => a - b); // e.g. [7, 30, 60]

  for (const cert of certificates) {
    const dynamicStatus = calculateCertificateDynamicStatus(cert, 30, referenceDate);
    const recipientUserId = cert.stakeholder?.user;

    if (!recipientUserId) {
      continue;
    }

    if (dynamicStatus === DYNAMIC_CERTIFICATE_STATUSES.EXPIRED) {
      summary.expiredCount++;

      // Check duplicate for expired notification
      const existingExpiredNotice = await Notification.findOne({
        recipient: recipientUserId,
        type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRED,
        relatedEntityId: cert._id,
      });

      if (!existingExpiredNotice) {
        await createNotification({
          recipient: recipientUserId,
          type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRED,
          title: `Verification Certificate Expired: ${cert.certificateNumber}`,
          message: `Statutory verification certificate ${cert.certificateNumber} has expired on ${new Date(cert.validUntil).toLocaleDateString('en-IN')}. Please submit a Re-Verification application immediately.`,
          relatedEntityType: 'Certificate',
          relatedEntityId: cert._id,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          link: `/certificates/${cert._id}`,
          metadata: {
            certificateNumber: cert.certificateNumber,
            validUntil: cert.validUntil,
            isExpired: true,
          },
        });
        summary.remindersSent++;
      } else {
        summary.duplicatesPrevented++;
      }
    } else {
      // Future expiry checking
      const validUntil = new Date(cert.validUntil);
      const daysRemaining = Math.ceil((validUntil.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 30) {
        summary.expiringSoonCount++;
      } else {
        summary.activeCount++;
      }

      // Determine the tightest applicable reminder window
      // e.g. if daysRemaining = 5 -> applies to window 7; if 20 -> applies to window 30; if 45 -> applies to window 60
      let matchedWindow = null;
      for (const windowDays of sortedWindows) {
        if (daysRemaining <= windowDays && daysRemaining > 0) {
          matchedWindow = windowDays;
          break; // pick the closest window
        }
      }

      if (matchedWindow !== null) {
        let reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30;
        let priority = NOTIFICATION_PRIORITIES.HIGH;

        if (matchedWindow <= 7) {
          reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7;
          priority = NOTIFICATION_PRIORITIES.HIGH;
        } else if (matchedWindow <= 30) {
          reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30;
          priority = NOTIFICATION_PRIORITIES.HIGH;
        } else if (matchedWindow <= 60) {
          reminderType = NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60;
          priority = NOTIFICATION_PRIORITIES.MEDIUM;
        }

        // Duplicate prevention: check if this specific reminder type was already sent for this certificate
        const existingReminder = await Notification.findOne({
          recipient: recipientUserId,
          type: reminderType,
          relatedEntityId: cert._id,
        });

        if (!existingReminder) {
          await createNotification({
            recipient: recipientUserId,
            type: reminderType,
            title: `Certificate Expiring in ${daysRemaining} Days (${cert.certificateNumber})`,
            message: `Verification certificate ${cert.certificateNumber} is expiring on ${validUntil.toLocaleDateString('en-IN')}. Submit your annual re-verification application soon.`,
            relatedEntityType: 'Certificate',
            relatedEntityId: cert._id,
            priority,
            link: `/certificates/${cert._id}`,
            metadata: {
              certificateNumber: cert.certificateNumber,
              validUntil: cert.validUntil,
              daysRemaining,
              windowDays: matchedWindow,
            },
          });
          summary.remindersSent++;
        } else {
          summary.duplicatesPrevented++;
        }
      }
    }
  }

  return summary;
}

/**
 * Checks all active instruments in MongoDB and sends DUE_SOON and OVERDUE statutory alerts.
 */
export async function checkInstrumentsDue({
  reminderThreshold = 30,
  now = new Date(),
} = {}) {
  const referenceDate = new Date(now);

  const instruments = await Instrument.find({
    isActive: true,
    nextVerificationDueDate: { $ne: null },
  }).populate({
    path: 'stakeholder',
    select: 'user businessName tradeLicenseNumber',
  });

  const summary = {
    totalChecked: instruments.length,
    upToDateCount: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    alertsSent: 0,
    duplicatesPrevented: 0,
  };

  for (const inst of instruments) {
    const dueStatus = calculateInstrumentDueStatus(inst, reminderThreshold, referenceDate);
    const recipientUserId = inst.stakeholder?.user;

    if (!recipientUserId) {
      continue;
    }

    const dueDateStr = new Date(inst.nextVerificationDueDate).toISOString().split('T')[0];

    if (dueStatus === INSTRUMENT_DUE_STATUSES.OVERDUE) {
      summary.overdueCount++;

      // Check if overdue notification already sent for this due date cycle
      const existingOverdue = await Notification.findOne({
        recipient: recipientUserId,
        type: NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
        relatedEntityId: inst._id,
        'metadata.dueDate': dueDateStr,
      });

      if (!existingOverdue) {
        await createNotification({
          recipient: recipientUserId,
          type: NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
          title: `Instrument Verification Overdue: ${inst.instrumentId || inst.serialNumber}`,
          message: `Instrument ${inst.instrumentId || inst.serialNumber} was due for verification on ${new Date(inst.nextVerificationDueDate).toLocaleDateString('en-IN')} and is now overdue. Continued commercial use without verification violates the Legal Metrology Act.`,
          relatedEntityType: 'Instrument',
          relatedEntityId: inst._id,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          link: `/instruments/${inst._id}`,
          metadata: {
            instrumentId: inst.instrumentId,
            serialNumber: inst.serialNumber,
            dueDate: dueDateStr,
            dueStatus: INSTRUMENT_DUE_STATUSES.OVERDUE,
          },
        });
        summary.alertsSent++;
      } else {
        summary.duplicatesPrevented++;
      }
    } else if (dueStatus === INSTRUMENT_DUE_STATUSES.DUE_SOON) {
      summary.dueSoonCount++;

      // Check if due-soon notification already sent for this cycle
      const existingDue = await Notification.findOne({
        recipient: recipientUserId,
        type: NOTIFICATION_TYPES.VERIFICATION_DUE,
        relatedEntityId: inst._id,
        'metadata.dueDate': dueDateStr,
      });

      if (!existingDue) {
        await createNotification({
          recipient: recipientUserId,
          type: NOTIFICATION_TYPES.VERIFICATION_DUE,
          title: `Instrument Verification Due Soon: ${inst.instrumentId || inst.serialNumber}`,
          message: `Instrument ${inst.instrumentId || inst.serialNumber} is scheduled for statutory verification on ${new Date(inst.nextVerificationDueDate).toLocaleDateString('en-IN')}. Please submit your verification request.`,
          relatedEntityType: 'Instrument',
          relatedEntityId: inst._id,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          link: `/instruments/${inst._id}`,
          metadata: {
            instrumentId: inst.instrumentId,
            serialNumber: inst.serialNumber,
            dueDate: dueDateStr,
            dueStatus: INSTRUMENT_DUE_STATUSES.DUE_SOON,
          },
        });
        summary.alertsSent++;
      } else {
        summary.duplicatesPrevented++;
      }
    } else {
      summary.upToDateCount++;
    }
  }

  return summary;
}

/**
 * Checks for overdue verification applications pending processing past the statutory SLA threshold.
 */
export async function checkOverdueApplications({
  overdueDays = ENV.OVERDUE_APPLICATION_DAYS,
  now = new Date(),
} = {}) {
  const referenceDate = new Date(now);
  const cutoffDate = new Date(referenceDate.getTime() - overdueDays * 24 * 60 * 60 * 1000);

  const pendingApps = await VerificationApplication.find({
    currentStatus: {
      $in: [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW],
    },
    submittedAt: { $lte: cutoffDate },
  }).populate('assignedLMO', '_id name email');

  const summary = {
    totalChecked: pendingApps.length,
    overdueApplications: pendingApps.length,
    alertsSent: 0,
    duplicatesPrevented: 0,
  };

  // Find admin users for escalation if officer not assigned
  const adminUsers = await User.find({
    role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
    isActive: true,
  }).select('_id');

  for (const app of pendingApps) {
    const targetUserId = app.assignedLMO?._id || adminUsers[0]?._id;
    if (!targetUserId) continue;

    const existingAlert = await Notification.findOne({
      recipient: targetUserId,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      relatedEntityId: app._id,
      'metadata.alertCategory': 'OVERDUE_APPLICATION_SLA',
    });

    if (!existingAlert) {
      await createNotification({
        recipient: targetUserId,
        type: NOTIFICATION_TYPES.SYSTEM_ALERT,
        title: `Overdue Application SLA Alert: ${app.applicationNumber}`,
        message: `Application ${app.applicationNumber} has been pending review for over ${overdueDays} days without schedule or decision. Immediate action required.`,
        relatedEntityType: 'Application',
        relatedEntityId: app._id,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        link: `/applications/${app._id}`,
        metadata: {
          applicationNumber: app.applicationNumber,
          submittedAt: app.submittedAt,
          alertCategory: 'OVERDUE_APPLICATION_SLA',
        },
      });
      summary.alertsSent++;
    } else {
      summary.duplicatesPrevented++;
    }
  }

  return summary;
}

/**
 * Comprehensive Expiry and Due-Date Job Runner.
 * Executes certificate checks, instrument due checks, and application SLA checks in a single coordinated run.
 */
export async function runExpiryAndDueDateChecks({
  now = new Date(),
  triggeredBy = null,
} = {}) {
  const startTime = Date.now();
  const executionDate = new Date(now);

  const [certificates, instruments, applications] = await Promise.all([
    checkExpiringCertificates({ now: executionDate }),
    checkInstrumentsDue({ now: executionDate }),
    checkOverdueApplications({ now: executionDate }),
  ]);

  const durationMs = Date.now() - startTime;

  const result = {
    success: true,
    executedAt: executionDate.toISOString(),
    durationMs,
    certificates,
    instruments,
    applications,
  };

  // Log statutory audit event if triggered by a user or system
  if (triggeredBy) {
    await logAuditEvent({
      user: triggeredBy._id || triggeredBy,
      userRole: triggeredBy.role || 'SYSTEM',
      userEmail: triggeredBy.email || 'system@doca.gov.in',
      action: AUDIT_ACTIONS.EXPIRY_CHECK_EXECUTED,
      entity: 'System',
      metadata: {
        certificatesChecked: certificates.totalChecked,
        certificatesExpired: certificates.expiredCount,
        instrumentsChecked: instruments.totalChecked,
        instrumentsOverdue: instruments.overdueCount,
        applicationsOverdue: applications.overdueApplications,
        durationMs,
      },
    });
  }

  return result;
}
