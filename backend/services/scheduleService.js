import mongoose from 'mongoose';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Instrument } from '../models/Instrument.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { User } from '../models/User.js';
import { VerificationCenter } from '../models/VerificationCenter.js';
import { GATC } from '../models/GATC.js';
import { ApiError } from '../utils/ApiError.js';
import {
  APPLICATION_STATUSES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  SCHEDULE_STATUSES,
  ALLOWED_SCHEDULE_STATUS_TRANSITIONS,
  USER_ROLES,
} from '../config/constants.js';
import { logAuditEvent } from './auditService.js';
import { createNotification } from './notificationService.js';
import { transitionApplicationStatus } from './applicationWorkflowService.js';
import { runInTransaction } from '../utils/transactionHelper.js';

export const ACTIVE_SCHEDULE_STATUSES = [
  SCHEDULE_STATUSES.PENDING,
  SCHEDULE_STATUSES.CONFIRMED,
  SCHEDULE_STATUSES.SCHEDULED,
  SCHEDULE_STATUSES.RESCHEDULED,
  SCHEDULE_STATUSES.IN_PROGRESS,
];

/**
 * Converts a "HH:mm" time string into total minutes from midnight.
 */
export function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return 0;
  const parts = t.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Evaluates whether two time intervals overlap.
 * Mathematical rule: start1 < end2 && end1 > start2
 */
export function doTimeslotsOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

/**
 * Normalizes input time slot or start/end times into standard range.
 */
export function parseTimeRange(timeSlot, startTime, endTime) {
  let start = startTime;
  let end = endTime;
  let slot = timeSlot;

  if (!start || !end) {
    if (timeSlot === '09:00 - 12:00') {
      start = '09:00';
      end = '12:00';
    } else if (timeSlot === '12:00 - 15:00') {
      start = '12:00';
      end = '15:00';
    } else if (timeSlot === '15:00 - 18:00') {
      start = '15:00';
      end = '18:00';
    } else if (timeSlot === 'FULL_DAY') {
      start = '09:00';
      end = '18:00';
    } else if (timeSlot && timeSlot.includes('-')) {
      const parts = timeSlot.split('-').map((s) => s.trim());
      start = parts[0] || '09:00';
      end = parts[1] || '12:00';
    } else {
      start = '09:00';
      end = '12:00';
      slot = '09:00 - 12:00';
    }
  }

  if (!slot) {
    slot = `${start} - ${end}`;
  }

  return { startTime: start, endTime: end, timeSlot: slot };
}

/**
 * Centralized Conflict Detection Engine
 * Verifies that:
 * 1. Application has no existing active schedule
 * 2. Officer has no overlapping schedule on the same date
 * 3. Field Officer has no overlapping schedule on the same date
 * 4. Instrument is not double-booked on overlapping timeslots
 * 5. Verification Center has not exceeded capacity
 */
export async function checkScheduleConflicts({
  scheduledDate,
  startTime,
  endTime,
  timeSlot,
  assignedOfficerId,
  assignedFieldOfficerId,
  instrumentId,
  verificationCenterId,
  applicationId,
  excludeScheduleId = null,
}) {
  const targetDate = new Date(scheduledDate);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const parsed = parseTimeRange(timeSlot, startTime, endTime);
  const reqStart = parsed.startTime;
  const reqEnd = parsed.endTime;

  if (timeToMinutes(reqStart) >= timeToMinutes(reqEnd)) {
    throw ApiError.badRequest(`Start time (${reqStart}) must be strictly earlier than end time (${reqEnd}).`);
  }

  // 1. Application conflict: An application cannot have multiple active schedules
  if (applicationId) {
    const appFilter = {
      application: applicationId,
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    };
    if (excludeScheduleId) {
      appFilter._id = { $ne: excludeScheduleId };
    }
    const existingActiveApp = await VerificationSchedule.findOne(appFilter);
    if (existingActiveApp) {
      throw ApiError.conflict('An active verification schedule already exists for this application.');
    }
  }

  // 2. Officer conflict: Check for overlapping schedules
  if (assignedOfficerId) {
    const officerFilter = {
      assignedOfficer: assignedOfficerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    };
    if (excludeScheduleId) {
      officerFilter._id = { $ne: excludeScheduleId };
    }
    const officerSchedules = await VerificationSchedule.find(officerFilter);
    for (const sched of officerSchedules) {
      const schedTimes = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(schedTimes.startTime, schedTimes.endTime, reqStart, reqEnd)) {
        throw ApiError.conflict(
          `Assigned officer already has an active verification scheduled from ${schedTimes.startTime} to ${schedTimes.endTime} on ${targetDate.toLocaleDateString('en-IN')}.`
        );
      }
    }
  }

  // 3. Field Officer conflict: Check for overlapping schedules
  if (assignedFieldOfficerId) {
    const fieldOfficerFilter = {
      assignedFieldOfficer: assignedFieldOfficerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    };
    if (excludeScheduleId) {
      fieldOfficerFilter._id = { $ne: excludeScheduleId };
    }
    const fvoSchedules = await VerificationSchedule.find(fieldOfficerFilter);
    for (const sched of fvoSchedules) {
      const schedTimes = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(schedTimes.startTime, schedTimes.endTime, reqStart, reqEnd)) {
        throw ApiError.conflict(
          `Assigned field officer already has a verification scheduled from ${schedTimes.startTime} to ${schedTimes.endTime} on ${targetDate.toLocaleDateString('en-IN')}.`
        );
      }
    }
  }

  // 4. Instrument conflict: Check for overlapping schedules
  if (instrumentId) {
    const instrumentFilter = {
      instrument: instrumentId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    };
    if (excludeScheduleId) {
      instrumentFilter._id = { $ne: excludeScheduleId };
    }
    const instSchedules = await VerificationSchedule.find(instrumentFilter);
    for (const sched of instSchedules) {
      const schedTimes = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(schedTimes.startTime, schedTimes.endTime, reqStart, reqEnd)) {
        throw ApiError.conflict(
          `This instrument is already booked for verification from ${schedTimes.startTime} to ${schedTimes.endTime} on ${targetDate.toLocaleDateString('en-IN')}.`
        );
      }
    }
  }

  // 5. Verification Center conflict and capacity limits
  if (verificationCenterId) {
    const center = await VerificationCenter.findById(verificationCenterId);
    if (!center) {
      throw ApiError.badRequest('Verification center not found.');
    }
    if (center.isActive === false) {
      throw ApiError.badRequest('Selected verification center is inactive or closed for verification.');
    }

    const centerFilter = {
      verificationCenter: verificationCenterId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    };
    if (excludeScheduleId) {
      centerFilter._id = { $ne: excludeScheduleId };
    }

    const totalCenterBookings = await VerificationSchedule.countDocuments(centerFilter);
    const capacity = typeof center.capacityPerDay === 'number' ? center.capacityPerDay : 20;

    if (totalCenterBookings >= capacity) {
      throw ApiError.conflict(
        `Verification center ${center.name} has reached its daily capacity limit (${capacity}) on ${targetDate.toLocaleDateString('en-IN')}.`
      );
    }
  }

  return true;
}

/**
 * Real-time Dynamic Availability Calculation from MongoDB
 */
export async function calculateAvailability({
  date,
  startTime,
  endTime,
  timeSlot,
  officerId,
  fieldOfficerId,
  instrumentId,
  centerId,
}) {
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest('Invalid date provided for availability calculation.');
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const parsed = parseTimeRange(timeSlot, startTime, endTime);
  const reqStart = parsed.startTime;
  const reqEnd = parsed.endTime;

  const conflicts = [];
  let officerAvailable = true;
  let fieldOfficerAvailable = true;
  let instrumentAvailable = true;
  let centerAvailable = true;

  if (officerId && mongoose.Types.ObjectId.isValid(officerId)) {
    const officerSchedules = await VerificationSchedule.find({
      assignedOfficer: officerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    }).populate('assignedOfficer', 'name');

    for (const sched of officerSchedules) {
      const st = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(st.startTime, st.endTime, reqStart, reqEnd)) {
        officerAvailable = false;
        conflicts.push({
          type: 'OFFICER_OVERLAP',
          entity: 'officer',
          message: `Officer ${sched.assignedOfficer?.name || officerId} is busy (${st.startTime} - ${st.endTime})`,
        });
      }
    }
  }

  if (fieldOfficerId && mongoose.Types.ObjectId.isValid(fieldOfficerId)) {
    const fvoSchedules = await VerificationSchedule.find({
      assignedFieldOfficer: fieldOfficerId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    }).populate('assignedFieldOfficer', 'name');

    for (const sched of fvoSchedules) {
      const st = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(st.startTime, st.endTime, reqStart, reqEnd)) {
        fieldOfficerAvailable = false;
        conflicts.push({
          type: 'FIELD_OFFICER_OVERLAP',
          entity: 'fieldOfficer',
          message: `Field Officer is busy (${st.startTime} - ${st.endTime})`,
        });
      }
    }
  }

  if (instrumentId && mongoose.Types.ObjectId.isValid(instrumentId)) {
    const instSchedules = await VerificationSchedule.find({
      instrument: instrumentId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ACTIVE_SCHEDULE_STATUSES },
    });

    for (const sched of instSchedules) {
      const st = parseTimeRange(sched.timeSlot, sched.startTime, sched.endTime);
      if (doTimeslotsOverlap(st.startTime, st.endTime, reqStart, reqEnd)) {
        instrumentAvailable = false;
        conflicts.push({
          type: 'INSTRUMENT_OVERLAP',
          entity: 'instrument',
          message: `Instrument is already scheduled for verification (${st.startTime} - ${st.endTime})`,
        });
      }
    }
  }

  if (centerId && mongoose.Types.ObjectId.isValid(centerId)) {
    const center = await VerificationCenter.findById(centerId);
    if (center) {
      if (center.isActive === false) {
        centerAvailable = false;
        conflicts.push({
          type: 'CENTER_INACTIVE',
          entity: 'center',
          message: `Center ${center.name} is currently inactive`,
        });
      } else {
        const count = await VerificationSchedule.countDocuments({
          verificationCenter: centerId,
          scheduledDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ACTIVE_SCHEDULE_STATUSES },
        });
        const cap = center.capacityPerDay || 20;
        if (count >= cap) {
          centerAvailable = false;
          conflicts.push({
            type: 'CENTER_CAPACITY_EXCEEDED',
            entity: 'center',
            message: `Center ${center.name} has reached daily capacity (${count}/${cap})`,
          });
        }
      }
    }
  }

  return {
    officerAvailable,
    fieldOfficerAvailable,
    instrumentAvailable,
    centerAvailable,
    conflicts,
  };
}

/**
 * State Transition Engine for Verification Schedules
 */
export async function transitionScheduleStatus(schedule, newStatus, user, { remarks, reason } = {}) {
  const currentStatus = schedule.status;

  if (currentStatus === newStatus) {
    return schedule;
  }

  const allowed = ALLOWED_SCHEDULE_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Invalid schedule status transition from ${currentStatus} to ${newStatus}. Permitted next statuses: [${allowed.join(', ')}]`
    );
  }

  let populatedStakeholderUser = null;
  let assignedOfficerId = schedule.assignedOfficer;
  let cancellationReason = null;

  await runInTransaction(async (session) => {
    schedule.status = newStatus;
    schedule.updatedBy = user._id;

    if (newStatus === SCHEDULE_STATUSES.IN_PROGRESS) {
      // Synchronize application status to INSPECTION
      const application = await VerificationApplication.findById(schedule.application).session(session || null);
      if (application && application.currentStatus === APPLICATION_STATUSES.SCHEDULED) {
        await transitionApplicationStatus(
          application,
          APPLICATION_STATUSES.INSPECTION,
          user,
          { session, remarks: remarks || 'Field verification inspection commenced' }
        );
      }
      await logAuditEvent(
        {
          user: user._id,
          userRole: user.role,
          userEmail: user.email,
          action: AUDIT_ACTIONS.SCHEDULE_STARTED,
          entity: 'VerificationSchedule',
          entityId: schedule._id,
          metadata: { remarks },
        },
        session
      );
    } else if (newStatus === SCHEDULE_STATUSES.COMPLETED) {
      await logAuditEvent(
        {
          user: user._id,
          userRole: user.role,
          userEmail: user.email,
          action: AUDIT_ACTIONS.SCHEDULE_COMPLETED,
          entity: 'VerificationSchedule',
          entityId: schedule._id,
          metadata: { remarks },
        },
        session
      );
    } else if (newStatus === SCHEDULE_STATUSES.CANCELLED) {
      cancellationReason = reason || remarks || 'Cancelled by administrative authority';
      schedule.cancellationReason = cancellationReason;
      schedule.cancelledBy = user._id;
      schedule.cancelledAt = new Date();

      // Check if there are other active schedules; if none, revert application to APPROVED
      const application = await VerificationApplication.findById(schedule.application).session(session || null);
      if (application && application.currentStatus === APPLICATION_STATUSES.SCHEDULED) {
        const remainingActive = await VerificationSchedule.findOne({
          _id: { $ne: schedule._id },
          application: application._id,
          status: { $in: ACTIVE_SCHEDULE_STATUSES },
        }).session(session || null);

        if (!remainingActive) {
          application.currentStatus = APPLICATION_STATUSES.APPROVED;
          application.statusHistory.push({
            fromStatus: APPLICATION_STATUSES.SCHEDULED,
            toStatus: APPLICATION_STATUSES.APPROVED,
            changedBy: user._id,
            reason: `Schedule cancelled: ${schedule.cancellationReason}`,
            changedAt: new Date(),
          });
          await application.save(session ? { session } : undefined);
        }
      }

      await logAuditEvent(
        {
          user: user._id,
          userRole: user.role,
          userEmail: user.email,
          action: AUDIT_ACTIONS.SCHEDULE_CANCELLED,
          entity: 'VerificationSchedule',
          entityId: schedule._id,
          metadata: { reason: schedule.cancellationReason },
        },
        session
      );
    }

    await schedule.save(session ? { session } : undefined);
  });

  // Post-commit notifications for cancellation
  if (newStatus === SCHEDULE_STATUSES.CANCELLED) {
    try {
      const populatedSchedule = await VerificationSchedule.findById(schedule._id).populate('stakeholder');
      if (populatedSchedule?.stakeholder?.user) {
        await createNotification({
          recipient: populatedSchedule.stakeholder.user,
          type: NOTIFICATION_TYPES.SCHEDULE_CANCELLED,
          title: 'Verification Schedule Cancelled',
          message: `Your verification schedule has been cancelled. Reason: ${cancellationReason}`,
          relatedEntityType: 'Schedule',
          relatedEntityId: schedule._id,
        });
      }
      if (assignedOfficerId) {
        await createNotification({
          recipient: assignedOfficerId,
          type: NOTIFICATION_TYPES.SCHEDULE_CANCELLED,
          title: 'Verification Schedule Cancelled',
          message: `Verification schedule assigned to you has been cancelled. Reason: ${cancellationReason}`,
          relatedEntityType: 'Schedule',
          relatedEntityId: schedule._id,
        });
      }
    } catch (e) {
      console.warn('[NOTIFICATION WARNING] Schedule cancelled notification failed:', e.message);
    }
  }

  return schedule;
}
