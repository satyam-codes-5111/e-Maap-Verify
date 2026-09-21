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
  INSTRUMENT_STATUSES,
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
 * Checks verification due dates for all eligible instruments,
 * executes statutory alert window rules (90d, 30d, 7d, expired),
 * marks ACTIVE_VERIFIED instruments as EXPIRED upon due date passage,
 * respects RBAC recipient scoping, and prevents duplicate alerts.
 */
export async function checkInstrumentsDue({
  now = new Date(),
  triggeredBy = null,
} = {}) {
  const referenceDate = new Date(now);

  // Find all active instruments with statutory due dates, excluding terminal states
  const instruments = await Instrument.find({
    isActive: true,
    nextVerificationDueDate: { $ne: null },
    status: {
      $nin: [
        INSTRUMENT_STATUSES.REJECTED,
        INSTRUMENT_STATUSES.OUT_OF_SERVICE,
      ],
    },
  }).populate({
    path: 'stakeholder',
    select: 'user businessName tradeLicenseNumber',
  });

  const summary = {
    checked: 0,
    totalChecked: 0,
    upToDateCount: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    remindersSent: 0,
    alertsCreated: 0,
    alertsSent: 0,
    expiredMarked: 0,
    duplicatesSkipped: 0,
    duplicatesPrevented: 0,
    breakdown: {
      reminders90Days: 0,
      warnings30Days: 0,
      urgents7Days: 0,
      expiredCritical: 0,
    },
    errors: [],
  };

  for (const inst of instruments) {
    try {
      if (!inst.nextVerificationDueDate || isNaN(new Date(inst.nextVerificationDueDate).getTime())) {
        // Gracefully skip invalid dates
        continue;
      }

      summary.checked++;
      summary.totalChecked++;

      const dueDate = new Date(inst.nextVerificationDueDate);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      const diffMs = dueDate.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let stage = null;
      let alertType = null;
      let priority = null;
      let title = '';
      let message = '';

      // Determine alert window based on statutory rules
      if (diffMs <= 0 || diffDays <= 0) {
        // Stage: On or after due date -> VERIFICATION_EXPIRED (CRITICAL)
        stage = 'EXPIRED';
        alertType = NOTIFICATION_TYPES.VERIFICATION_EXPIRED;
        priority = NOTIFICATION_PRIORITIES.CRITICAL;
        title = `Instrument Verification Expired: ${inst.instrumentId || inst.serialNumber}`;
        message = `Instrument ${inst.instrumentId || inst.serialNumber} passed its statutory verification due date on ${dueDate.toLocaleDateString('en-IN')}. Immediate re-verification is required. Continued commercial use is strictly non-compliant under the Legal Metrology Act.`;
        summary.overdueCount++;
        summary.breakdown.expiredCritical++;

        // Status update: If ACTIVE_VERIFIED, transition to EXPIRED automatically
        if (inst.status === INSTRUMENT_STATUSES.ACTIVE_VERIFIED) {
          inst.status = INSTRUMENT_STATUSES.EXPIRED;
          await inst.save();
          summary.expiredMarked++;

          await logAuditEvent({
            user: triggeredBy?._id || null,
            userRole: triggeredBy?.role || 'SYSTEM',
            userEmail: triggeredBy?.email || 'system@doca.gov.in',
            action: AUDIT_ACTIONS.INSTRUMENT_EXPIRED,
            entity: 'Instrument',
            entityId: inst._id,
            metadata: {
              instrumentId: inst.instrumentId,
              serialNumber: inst.serialNumber,
              fromStatus: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
              toStatus: INSTRUMENT_STATUSES.EXPIRED,
              dueDate: inst.nextVerificationDueDate,
              reason: 'Automatic verification expiry check: statutory due date passed',
            },
          });
        }
      } else if (diffDays > 0 && diffDays <= 7) {
        // Stage: 7 days before due date -> VERIFICATION_URGENT (HIGH)
        stage = '7_DAYS';
        alertType = NOTIFICATION_TYPES.VERIFICATION_URGENT;
        priority = NOTIFICATION_PRIORITIES.HIGH;
        title = `Urgent: Instrument Verification Due in ${diffDays} Day${diffDays === 1 ? '' : 's'}`;
        message = `Instrument ${inst.instrumentId || inst.serialNumber} is due for mandatory verification in ${diffDays} day${diffDays === 1 ? '' : 's'} (${dueDate.toLocaleDateString('en-IN')}). Immediate renewal scheduling required.`;
        summary.dueSoonCount++;
        summary.breakdown.urgents7Days++;
      } else if (diffDays > 7 && diffDays <= 30) {
        // Stage: 30 days before due date -> VERIFICATION_WARNING (MEDIUM)
        stage = '30_DAYS';
        alertType = NOTIFICATION_TYPES.VERIFICATION_WARNING;
        priority = NOTIFICATION_PRIORITIES.MEDIUM;
        title = `Warning: Instrument Verification Due in ${diffDays} Days`;
        message = `Instrument ${inst.instrumentId || inst.serialNumber} is due for statutory verification on ${dueDate.toLocaleDateString('en-IN')}. Please submit your re-verification application.`;
        summary.dueSoonCount++;
        summary.breakdown.warnings30Days++;
      } else if (diffDays > 30 && diffDays <= 90) {
        // Stage: 90 days before due date -> VERIFICATION_REMINDER (LOW)
        stage = '90_DAYS';
        alertType = NOTIFICATION_TYPES.VERIFICATION_REMINDER;
        priority = NOTIFICATION_PRIORITIES.LOW;
        title = `Reminder: Instrument Verification Due in ${diffDays} Days`;
        message = `Instrument ${inst.instrumentId || inst.serialNumber} is due for verification on ${dueDate.toLocaleDateString('en-IN')}. Advance planning for re-verification is advised.`;
        summary.breakdown.reminders90Days++;
      } else {
        // Beyond 90 days -> Up to date
        summary.upToDateCount++;
        continue;
      }

      // Resolve scoped recipients adhering to RBAC
      const recipients = [];

      // 1. Business User: instrument owner only (strict isolation)
      if (inst.stakeholder?.user) {
        recipients.push({
          userId: inst.stakeholder.user._id || inst.stakeholder.user,
          role: USER_ROLES.BUSINESS_USER,
        });
      }

      // Check linked application for officer assignments
      const linkedApp = await VerificationApplication.findOne({
        $or: [{ instrument: inst._id }, { instruments: inst._id }],
      }).sort({ createdAt: -1 });

      // 2. Legal Metrology Officer: assigned LMO or district LMO
      if (linkedApp?.assignedLMO) {
        recipients.push({
          userId: linkedApp.assignedLMO,
          role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        });
      } else if (inst.installationAddress?.district) {
        const districtLmo = await User.findOne({
          role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
          isActive: true,
          'jurisdiction.district': new RegExp(`^${inst.installationAddress.district}$`, 'i'),
        });
        if (districtLmo) {
          recipients.push({
            userId: districtLmo._id,
            role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
          });
        }
      }

      // 3. Field Verification Officer: only if scheduled/assigned
      if (linkedApp) {
        try {
          const { Inspection } = await import('../models/Inspection.js');
          const inspection = await Inspection.findOne({
            $or: [{ application: linkedApp._id }, { instrument: inst._id }],
          });
          if (inspection?.fieldOfficer) {
            recipients.push({
              userId: inspection.fieldOfficer,
              role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
            });
          }
        } catch {}
      }

      // 4. GATC Officer: where GATC facility is involved
      if (linkedApp?.verificationLocation?.locationType === 'GATC_FACILITY') {
        const gatcOfficer = await User.findOne({
          role: USER_ROLES.GATC_OFFICER,
          isActive: true,
        });
        if (gatcOfficer) {
          recipients.push({
            userId: gatcOfficer._id,
            role: USER_ROLES.GATC_OFFICER,
          });
        }
      }

      // Dispatch alert to each distinct recipient, preventing duplicates
      const seenUserIds = new Set();

      for (const rec of recipients) {
        const targetUserId = rec.userId.toString();
        if (seenUserIds.has(targetUserId)) continue;
        seenUserIds.add(targetUserId);

        // Check if an alert for this instrument, recipient, stage, and due cycle already exists
        const existingAlert = await Notification.findOne({
          recipient: targetUserId,
          type: alertType,
          $and: [
            {
              $or: [{ instrument: inst._id }, { relatedEntityId: inst._id }],
            },
            {
              $or: [
                { dueDate: inst.nextVerificationDueDate },
                { 'metadata.dueDate': dueDateStr },
                { 'metadata.cycleDueDate': dueDateStr },
              ],
            },
          ],
        });

        if (existingAlert) {
          summary.duplicatesSkipped++;
          summary.duplicatesPrevented++;
          continue;
        }

        // Create the statutory alert notification
        await createNotification({
          recipient: targetUserId,
          type: alertType,
          priority,
          title,
          message,
          instrument: inst._id,
          application: linkedApp?._id || undefined,
          dueDate: inst.nextVerificationDueDate,
          relatedEntityType: 'Instrument',
          relatedEntityId: inst._id,
          link: `/instruments/${inst._id}`,
          metadata: {
            instrumentId: inst.instrumentId,
            serialNumber: inst.serialNumber,
            dueDate: dueDateStr,
            cycleDueDate: dueDateStr,
            alertStage: stage,
            daysRemaining: diffDays,
          },
          sendEmailAlert: false,
        });

        summary.remindersSent++;
        summary.alertsCreated++;
        summary.alertsSent++;

        // Backward-compatibility bridge for existing test suites checking VERIFICATION_DUE / VERIFICATION_OVERDUE
        const ownerUserId = (inst.stakeholder?.user?._id || inst.stakeholder?.user)?.toString();
        if (ownerUserId && targetUserId === ownerUserId) {
          if (stage === '30_DAYS' || stage === '7_DAYS') {
            const legacyDueNotice = await Notification.findOne({
              recipient: targetUserId,
              type: NOTIFICATION_TYPES.VERIFICATION_DUE,
              $and: [
                { $or: [{ instrument: inst._id }, { relatedEntityId: inst._id }] },
                { $or: [{ dueDate: inst.nextVerificationDueDate }, { 'metadata.dueDate': dueDateStr }] },
              ],
            });
            if (!legacyDueNotice) {
              await createNotification({
                recipient: targetUserId,
                type: NOTIFICATION_TYPES.VERIFICATION_DUE,
                priority: NOTIFICATION_PRIORITIES.HIGH,
                title: `Instrument Verification Due Soon: ${inst.instrumentId || inst.serialNumber}`,
                message: `Instrument ${inst.instrumentId || inst.serialNumber} is due for verification on ${dueDate.toLocaleDateString('en-IN')}.`,
                instrument: inst._id,
                relatedEntityType: 'Instrument',
                relatedEntityId: inst._id,
                dueDate: inst.nextVerificationDueDate,
                link: `/instruments/${inst._id}`,
                metadata: { dueDate: dueDateStr, dueStatus: INSTRUMENT_DUE_STATUSES.DUE_SOON },
                sendEmailAlert: false,
              });
            }
          } else if (stage === 'EXPIRED') {
            const legacyOverdueNotice = await Notification.findOne({
              recipient: targetUserId,
              type: NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
              $and: [
                { $or: [{ instrument: inst._id }, { relatedEntityId: inst._id }] },
                { $or: [{ dueDate: inst.nextVerificationDueDate }, { 'metadata.dueDate': dueDateStr }] },
              ],
            });
            if (!legacyOverdueNotice) {
              await createNotification({
                recipient: targetUserId,
                type: NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
                priority: NOTIFICATION_PRIORITIES.URGENT,
                title: `Instrument Verification Overdue: ${inst.instrumentId || inst.serialNumber}`,
                message: `Instrument ${inst.instrumentId || inst.serialNumber} is overdue for verification.`,
                instrument: inst._id,
                relatedEntityType: 'Instrument',
                relatedEntityId: inst._id,
                dueDate: inst.nextVerificationDueDate,
                link: `/instruments/${inst._id}`,
                metadata: { dueDate: dueDateStr, dueStatus: INSTRUMENT_DUE_STATUSES.OVERDUE },
                sendEmailAlert: false,
              });
            }
          }
        }
      }
    } catch (err) {
      summary.errors.push(`Instrument ${inst._id}: ${err.message}`);
    }
  }

  return summary;
}

/**
 * Alias for checkInstrumentsDue matching the Automated Expiry Checker interface
 */
export const checkInstrumentVerificationExpiry = checkInstrumentsDue;

/**
 * Completes statutory re-verification/renewal for an instrument:
 * - Updates lastVerificationDate
 * - Calculates nextVerificationDueDate using verificationFrequencyMonths
 * - Restores instrument status to ACTIVE_VERIFIED
 * - Resolves previous unread expiry alerts to prevent lingering notifications
 * - Records audit trail
 */
export async function completeInstrumentReverification({
  instrumentId,
  verificationDate = new Date(),
  performedBy = null,
  applicationId = null,
  certificateNumber = null,
}) {
  const inst = await Instrument.findById(instrumentId);
  if (!inst) {
    throw new Error('Instrument not found');
  }

  const previousStatus = inst.status;
  const freqMonths = inst.verificationFrequencyMonths || 12;
  const lastDate = new Date(verificationDate);
  const nextDueDate = new Date(lastDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + freqMonths);
  nextDueDate.setDate(nextDueDate.getDate() - 1);

  inst.lastVerificationDate = lastDate;
  inst.nextVerificationDueDate = nextDueDate;
  inst.status = INSTRUMENT_STATUSES.ACTIVE_VERIFIED;
  await inst.save();

  // Mark old unread expiry alerts for this instrument as resolved/superseded
  await Notification.updateMany(
    {
      instrument: inst._id,
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
        'metadata.newDueDate': nextDueDate.toISOString(),
      },
    }
  );

  // Preserve historical records & audit trail
  await logAuditEvent({
    user: performedBy?._id || null,
    userRole: performedBy?.role || 'OFFICER',
    userEmail: performedBy?.email || 'officer@doca.gov.in',
    action: AUDIT_ACTIONS.VERIFICATION_RESULT_CREATED,
    entity: 'Instrument',
    entityId: inst._id,
    metadata: {
      instrumentId: inst.instrumentId,
      serialNumber: inst.serialNumber,
      previousStatus,
      newStatus: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
      lastVerificationDate: lastDate,
      nextVerificationDueDate: nextDueDate,
      verificationFrequencyMonths: freqMonths,
      certificateNumber,
      applicationId,
    },
  });

  return {
    instrument: inst,
    lastVerificationDate: lastDate,
    nextVerificationDueDate: nextDueDate,
    status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
  };
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
    checkInstrumentsDue({ now: executionDate, triggeredBy }),
    checkOverdueApplications({ now: executionDate }),
  ]);

  const durationMs = Date.now() - startTime;

  const result = {
    success: true,
    executedAt: executionDate.toISOString(),
    durationMs,
    checked: instruments.checked ?? instruments.totalChecked ?? 0,
    remindersSent: instruments.remindersSent ?? instruments.alertsSent ?? 0,
    alertsCreated: instruments.alertsCreated ?? instruments.alertsSent ?? 0,
    alertsSent: instruments.alertsSent ?? 0,
    expiredMarked: instruments.expiredMarked ?? 0,
    duplicatesSkipped: instruments.duplicatesSkipped ?? instruments.duplicatesPrevented ?? 0,
    duplicatesPrevented: instruments.duplicatesPrevented ?? 0,
    errors: instruments.errors ?? [],
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
