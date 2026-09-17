import { VerificationApplication } from '../models/VerificationApplication.js';
import { ApiError } from '../utils/ApiError.js';
import {
  APPLICATION_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
} from '../config/constants.js';
import { logAuditEvent } from './auditService.js';
import { createNotification } from './notificationService.js';

/**
 * Centralized Status Transition Engine for Verification Applications
 * Enforces legal state machine rules and records audit trails.
 */
export const validateTransition = (currentStatus, targetStatus) => {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(
      `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed next states: ${
        allowed.length > 0 ? allowed.join(', ') : 'NONE (terminal state)'
      }`
    );
  }
  return true;
};

export const transitionApplicationStatus = async (
  application,
  targetStatus,
  user,
  options = {}
) => {
  const fromStatus = application.currentStatus;
  validateTransition(fromStatus, targetStatus);

  application.currentStatus = targetStatus;
  application.updatedBy = user._id;

  const timestamp = new Date();

  // Handle statutory status-specific metadata updates
  switch (targetStatus) {
    case APPLICATION_STATUSES.SUBMITTED:
      application.submittedAt = timestamp;
      application.submissionDate = timestamp;
      break;

    case APPLICATION_STATUSES.UNDER_REVIEW:
      application.reviewedBy = user._id;
      application.reviewedAt = timestamp;
      if (options.remarks) {
        application.reviewRemarks = options.remarks;
      }
      break;

    case APPLICATION_STATUSES.APPROVED:
      application.reviewedBy = user._id;
      application.reviewedAt = timestamp;
      if (options.remarks) {
        application.reviewRemarks = options.remarks;
      }
      break;

    case APPLICATION_STATUSES.REJECTED:
      if (!options.rejectionReason || options.rejectionReason.trim().length === 0) {
        throw ApiError.badRequest('Specific statutory rejection reason is mandatory.');
      }
      application.reviewedBy = user._id;
      application.reviewedAt = timestamp;
      application.rejectionReason = options.rejectionReason.trim();
      break;

    case APPLICATION_STATUSES.SCHEDULED:
      application.scheduledAt = timestamp;
      break;

    case APPLICATION_STATUSES.COMPLETED:
      application.completedAt = timestamp;
      break;

    default:
      break;
  }

  // Push immutable status transition history record
  application.statusHistory.push({
    fromStatus,
    toStatus: targetStatus,
    changedBy: user._id,
    remarks:
      options.remarks ||
      options.rejectionReason ||
      `Application transitioned from ${fromStatus} to ${targetStatus}`,
    timestamp,
  });

  await application.save(options.session ? { session: options.session } : undefined);

  // Determine audit action
  let auditAction = AUDIT_ACTIONS.APPLICATION_STATUS_UPDATED;
  if (targetStatus === APPLICATION_STATUSES.SUBMITTED) {
    auditAction = AUDIT_ACTIONS.APPLICATION_SUBMITTED;
  } else if (targetStatus === APPLICATION_STATUSES.UNDER_REVIEW) {
    auditAction = AUDIT_ACTIONS.APPLICATION_REVIEWED;
  } else if (targetStatus === APPLICATION_STATUSES.APPROVED) {
    auditAction = AUDIT_ACTIONS.APPLICATION_APPROVED;
  } else if (targetStatus === APPLICATION_STATUSES.REJECTED) {
    auditAction = AUDIT_ACTIONS.APPLICATION_REJECTED;
  }

  await logAuditEvent(
    {
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: auditAction,
      entity: 'VerificationApplication',
      entityId: application._id,
      metadata: {
        applicationNumber: application.applicationNumber,
        fromStatus,
        toStatus: targetStatus,
        remarks: options.remarks || options.rejectionReason,
      },
    },
    options.session || null
  );

  // Notification Hooks
  try {
    const populated = await VerificationApplication.findById(application._id).populate('stakeholder');
    const recipientUser = populated?.stakeholder?.user;

    if (recipientUser) {
      if (targetStatus === APPLICATION_STATUSES.SUBMITTED) {
        await createNotification({
          recipient: recipientUser,
          type: NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
          title: 'Verification Application Submitted',
          message: `Your application ${application.applicationNumber} has been successfully submitted for departmental verification.`,
          relatedEntityType: 'Application',
          relatedEntityId: application._id,
          link: `/applications/${application._id}`,
        });
      } else if (targetStatus === APPLICATION_STATUSES.APPROVED) {
        await createNotification({
          recipient: recipientUser,
          type: NOTIFICATION_TYPES.APPLICATION_APPROVED,
          title: 'Verification Application Approved',
          message: `Your application ${application.applicationNumber} has been approved and is queued for verification scheduling.`,
          relatedEntityType: 'Application',
          relatedEntityId: application._id,
          link: `/applications/${application._id}`,
        });
      } else if (targetStatus === APPLICATION_STATUSES.REJECTED) {
        await createNotification({
          recipient: recipientUser,
          type: NOTIFICATION_TYPES.APPLICATION_REJECTED,
          title: 'Verification Application Rejected',
          message: `Your application ${application.applicationNumber} was rejected: ${options.rejectionReason}`,
          relatedEntityType: 'Application',
          relatedEntityId: application._id,
          link: `/applications/${application._id}`,
        });
      }
    }
  } catch (notifyErr) {
    console.error('Notification dispatch error (non-blocking):', notifyErr.message);
  }

  return application;
};
