import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { User } from '../models/User.js';
import { sendEmail } from './emailService.js';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} from '../config/constants.js';

/**
 * Retrieves notification preferences for a user, or creates default preferences if not yet existing.
 */
export async function getNotificationPreferences(userId) {
  let pref = await NotificationPreference.findOne({ user: userId });
  if (!pref) {
    pref = await NotificationPreference.create({
      user: userId,
      inAppEnabled: true,
      emailEnabled: true,
      reminderWindows: {
        day60: true,
        day30: true,
        day7: true,
        onExpiry: true,
      },
      categories: {
        certificateExpiry: true,
        verificationDue: true,
        workflowUpdates: true,
        systemAlerts: true,
      },
    });
  }
  return pref;
}

/**
 * Updates notification preferences for a user
 */
export async function updateNotificationPreferences(userId, updates = {}) {
  const pref = await getNotificationPreferences(userId);
  if (typeof updates.inAppEnabled === 'boolean') {
    pref.inAppEnabled = updates.inAppEnabled;
  }
  if (typeof updates.emailEnabled === 'boolean') {
    pref.emailEnabled = updates.emailEnabled;
  }
  if (updates.reminderWindows && typeof updates.reminderWindows === 'object') {
    pref.reminderWindows = {
      ...pref.reminderWindows?.toObject?.() || pref.reminderWindows,
      ...updates.reminderWindows,
    };
  }
  if (updates.categories && typeof updates.categories === 'object') {
    pref.categories = {
      ...pref.categories?.toObject?.() || pref.categories,
      ...updates.categories,
    };
  }
  await pref.save();
  return pref;
}

/**
 * Resolves standard statutory priority based on notification type
 */
function resolveDefaultPriority(type) {
  if (
    type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRED ||
    type === NOTIFICATION_TYPES.VERIFICATION_OVERDUE ||
    type === NOTIFICATION_TYPES.VERIFICATION_FAILED
  ) {
    return NOTIFICATION_PRIORITIES.URGENT;
  }
  if (
    type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7 ||
    type === NOTIFICATION_TYPES.VERIFICATION_DUE ||
    type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30 ||
    type === NOTIFICATION_TYPES.APPLICATION_REJECTED
  ) {
    return NOTIFICATION_PRIORITIES.HIGH;
  }
  if (
    type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60 ||
    type === NOTIFICATION_TYPES.CERTIFICATE_ISSUED ||
    type === NOTIFICATION_TYPES.CERTIFICATE_GENERATED ||
    type === NOTIFICATION_TYPES.VERIFICATION_PASSED ||
    type === NOTIFICATION_TYPES.APPLICATION_APPROVED ||
    type === NOTIFICATION_TYPES.SCHEDULE_CREATED ||
    type === NOTIFICATION_TYPES.SCHEDULE_CHANGED ||
    type === NOTIFICATION_TYPES.INSPECTION_ASSIGNED ||
    type === NOTIFICATION_TYPES.INSPECTION_COMPLETED
  ) {
    return NOTIFICATION_PRIORITIES.MEDIUM;
  }
  return NOTIFICATION_PRIORITIES.LOW;
}

/**
 * Creates in-app notification and dispatches email alert adhering to recipient preferences
 */
export async function createNotification({
  recipientId,
  recipient,
  type = NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
  title,
  message,
  relatedEntityType,
  relatedEntityId,
  priority,
  link = '',
  metadata = {},
  expiresAt,
  sendEmailAlert = true,
}, session = null) {
  try {
    const targetUserId = recipient || recipientId;
    if (!targetUserId) {
      console.warn('[NOTIFICATION SERVICE] Warning: Missing recipient for notification:', title);
      return null;
    }

    const preferences = await getNotificationPreferences(targetUserId);

    // Check category preferences
    if (preferences.categories) {
      if (
        (type.startsWith('CERTIFICATE_EXPIR') || type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRED) &&
        preferences.categories.certificateExpiry === false
      ) {
        return null;
      }
      if (
        (type === NOTIFICATION_TYPES.VERIFICATION_DUE || type === NOTIFICATION_TYPES.VERIFICATION_OVERDUE) &&
        preferences.categories.verificationDue === false
      ) {
        return null;
      }
      if (
        (type.startsWith('APPLICATION_') ||
          type.startsWith('SCHEDULE_') ||
          type.startsWith('INSPECTION_') ||
          type.startsWith('VERIFICATION_')) &&
        preferences.categories.workflowUpdates === false
      ) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.SYSTEM_ALERT && preferences.categories.systemAlerts === false) {
        return null;
      }
    }

    // Check reminder window preferences
    if (preferences.reminderWindows) {
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60 && preferences.reminderWindows.day60 === false) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30 && preferences.reminderWindows.day30 === false) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7 && preferences.reminderWindows.day7 === false) {
        return null;
      }
      if (type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRED && preferences.reminderWindows.onExpiry === false) {
        return null;
      }
    }

    // In-app notifications toggle
    if (preferences.inAppEnabled === false) {
      return null;
    }

    const resolvedPriority = priority || resolveDefaultPriority(type);

    const notification = new Notification({
      recipient: targetUserId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      priority: resolvedPriority,
      link,
      metadata,
      expiresAt,
    });

    await notification.save(session ? { session } : undefined);

    // Dispatches email alert if email is enabled for user & preference is true
    if (sendEmailAlert && preferences.emailEnabled !== false) {
      User.findById(targetUserId)
        .select('email name')
        .then((user) => {
          if (user && user.email) {
            sendEmail({
              to: user.email,
              subject: `[DoCA Legal Metrology] ${title}`,
              text: `${message}\n\nAccess details at: ${link}`,
              html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
                  <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Legal Metrology Verification Alert</h2>
                  <p>Dear ${user.name},</p>
                  <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0;">
                    <h4 style="margin: 0 0 6px 0; color: #0369a1;">${title}</h4>
                    <p style="margin: 0;">${message}</p>
                  </div>
                  ${link ? `<p><a href="${link}" style="display: inline-block; padding: 10px 18px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details</a></p>` : ''}
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;" />
                  <p style="font-size: 12px; color: #64748b;">Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution, Government of India.</p>
                </div>
              `,
            }).catch((err) => console.error('[EMAIL ERROR]', err.message));
          }
        })
        .catch((err) => console.error('[NOTIFICATION USER LOOKUP ERROR]', err.message));
    }

    return notification;
  } catch (error) {
    console.error('[NOTIFICATION SERVICE ERROR] Failed to create notification:', error.message);
    return null;
  }
}
