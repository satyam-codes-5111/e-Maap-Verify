import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notificationService.js';
import { runExpiryAndDueDateChecks } from '../services/expiryService.js';
import { logAuditEvent } from '../services/auditService.js';
import { AUDIT_ACTIONS, USER_ROLES } from '../config/constants.js';

/**
 * List Notifications with pagination, status/priority filtering, and ownership isolation.
 * GET /api/notifications
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const isAdmin = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role);
  let filter;

  if (isAdmin && (req.query.all === 'true' || req.query.scope === 'all')) {
    filter = {};
    if (req.query.recipient) {
      filter.recipient = req.query.recipient;
    }
  } else {
    // Strict ownership isolation - user only sees their own notifications
    filter = { recipient: req.user._id };
  }

  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === 'true';
  }

  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (req.query.relatedEntityType) {
    filter.relatedEntityType = req.query.relatedEntityType;
  }

  if (req.query.instrument) {
    filter.$or = [{ instrument: req.query.instrument }, { relatedEntityId: req.query.instrument }];
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: searchRegex }, { message: searchRegex }];
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  const response = buildPaginationResponse(notifications, total, page, limit);
  response.unreadCount = unreadCount;

  return ApiResponse.success(res, response, 'Notifications retrieved successfully');
});

/**
 * Get count of unread notifications for current user.
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return ApiResponse.success(res, { unreadCount }, 'Unread count retrieved successfully');
});

/**
 * Mark a single notification as read with strict cross-user authorization check.
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid notification ID format');
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  // Cross-user authorization check
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Unauthorized access: cannot access notifications belonging to another user');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return ApiResponse.success(res, notification, 'Notification marked as read');
});

/**
 * Mark all notifications as read for current user.
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return ApiResponse.success(
    res,
    { modifiedCount: result.modifiedCount },
    'All notifications marked as read'
  );
});

/**
 * Delete a notification with strict authorization check.
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid notification ID format');
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  // Cross-user authorization check
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Unauthorized: cannot delete notifications belonging to another user');
  }

  await Notification.findByIdAndDelete(id);

  return ApiResponse.success(res, null, 'Notification deleted successfully');
});

/**
 * Retrieve user's notification preferences.
 * GET /api/notifications/preferences
 */
export const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await getNotificationPreferences(req.user._id);
  return ApiResponse.success(res, preferences, 'Notification preferences retrieved');
});

/**
 * Update user's notification preferences.
 * PUT /api/notifications/preferences
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await updateNotificationPreferences(req.user._id, req.body);

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.NOTIFICATION_PREFERENCE_UPDATED,
    entity: 'NotificationPreference',
    entityId: preferences._id,
    metadata: {
      inAppEnabled: preferences.inAppEnabled,
      emailEnabled: preferences.emailEnabled,
    },
  });

  return ApiResponse.success(res, preferences, 'Notification preferences updated successfully');
});

/**
 * Admin trigger endpoint to execute statutory expiry and due-date engine on demand.
 * POST /api/notifications/run-expiry-checks
 */
export const triggerExpiryChecks = asyncHandler(async (req, res) => {
  // Only Admin or LMO can trigger global expiry check run
  const allowedRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.LEGAL_METROLOGY_OFFICER];
  if (!allowedRoles.includes(req.user.role)) {
    throw ApiError.forbidden('Only administrative or verification officers can trigger statutory expiry runs.');
  }

  const result = await runExpiryAndDueDateChecks({ triggeredBy: req.user });

  return ApiResponse.success(res, result, 'Statutory expiry and due-date checks executed successfully');
});
