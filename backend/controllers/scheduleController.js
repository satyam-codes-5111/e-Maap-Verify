import mongoose from 'mongoose';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Instrument } from '../models/Instrument.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { User } from '../models/User.js';
import { VerificationCenter } from '../models/VerificationCenter.js';
import { GATC } from '../models/GATC.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import {
  APPLICATION_STATUSES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  SCHEDULE_STATUSES,
  USER_ROLES,
} from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { transitionApplicationStatus } from '../services/applicationWorkflowService.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import {
  parseTimeRange,
  checkScheduleConflicts,
  calculateAvailability,
  transitionScheduleStatus,
  ACTIVE_SCHEDULE_STATUSES,
} from '../services/scheduleService.js';

export const scheduleApplication = asyncHandler(async (req, res) => {
  const applicationId = req.body.applicationId || req.body.application;
  const assignedOfficerId = req.body.assignedOfficer || req.body.assignedOfficerId || req.body.officerId;
  const assignedFieldOfficerId = req.body.assignedFieldOfficer || req.body.assignedFieldOfficerId || req.body.fieldOfficerId;
  const verificationCenterId = req.body.verificationCenterId || req.body.verificationCenter || req.body.centerId;
  const gatcId = req.body.gatcId || req.body.assignedGATC || req.body.gatc;
  const scheduledDate = req.body.scheduledDate || req.body.date || req.body.verificationDate;
  const { timeSlot, startTime, endTime, locationType, locationAddress, specialInstructions, notes } = req.body;

  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    throw ApiError.badRequest('A valid application ID is required.');
  }
  if (!assignedOfficerId || !mongoose.Types.ObjectId.isValid(assignedOfficerId)) {
    throw ApiError.badRequest('A valid assigned officer ID is required.');
  }
  if (!scheduledDate) {
    throw ApiError.badRequest('Scheduled verification date is required.');
  }

  const application = await VerificationApplication.findById(applicationId).populate('stakeholder');
  if (!application) {
    throw ApiError.notFound('Verification application not found');
  }

  // Pre-condition: Application must be in APPROVED state
  if (application.currentStatus !== APPLICATION_STATUSES.APPROVED) {
    throw ApiError.badRequest(
      `Only APPROVED applications can be scheduled for verification. Current status: ${application.currentStatus}`
    );
  }

  // Check assigned officer exists, is active, and is not a business user
  const officer = await User.findById(assignedOfficerId);
  if (!officer) {
    throw ApiError.notFound('Assigned officer not found');
  }
  if (officer.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.badRequest('A business user cannot be assigned as a verification officer.');
  }
  const allowedOfficerRoles = [
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
  ];
  if (!allowedOfficerRoles.includes(officer.role)) {
    throw ApiError.badRequest('Invalid officer role: must be an authorized verification officer.');
  }
  if (officer.isActive === false) {
    throw ApiError.badRequest('Selected verification officer account is inactive.');
  }

  // Optional Field Officer validation
  let fieldOfficer = null;
  if (assignedFieldOfficerId) {
    if (!mongoose.Types.ObjectId.isValid(assignedFieldOfficerId)) {
      throw ApiError.badRequest('Invalid field officer ID.');
    }
    fieldOfficer = await User.findById(assignedFieldOfficerId);
    if (!fieldOfficer) {
      throw ApiError.notFound('Assigned field officer not found');
    }
    if (fieldOfficer.role !== USER_ROLES.FIELD_VERIFICATION_OFFICER) {
      throw ApiError.badRequest('Invalid field officer role: must be FIELD_VERIFICATION_OFFICER.');
    }
    if (fieldOfficer.isActive === false) {
      throw ApiError.badRequest('Selected field verification officer account is inactive.');
    }
  }

  // Optional Verification Center validation
  let center = null;
  if (verificationCenterId) {
    if (!mongoose.Types.ObjectId.isValid(verificationCenterId)) {
      throw ApiError.badRequest('Invalid verification center ID.');
    }
    center = await VerificationCenter.findById(verificationCenterId);
    if (!center) {
      throw ApiError.notFound('Verification center not found');
    }
    if (center.isActive === false) {
      throw ApiError.badRequest('Selected verification center is inactive or closed for verification.');
    }
  }

  // Optional GATC validation
  let gatcEntity = null;
  if (gatcId) {
    if (!mongoose.Types.ObjectId.isValid(gatcId)) {
      throw ApiError.badRequest('Invalid GATC facility ID.');
    }
    gatcEntity = await GATC.findById(gatcId);
    if (!gatcEntity) {
      throw ApiError.notFound('GATC facility not found');
    }
    if (gatcEntity.isActive === false) {
      throw ApiError.badRequest('Selected GATC facility is inactive.');
    }
  }

  const targetDate = new Date(scheduledDate);
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest('Invalid scheduled date provided.');
  }

  const parsedTime = parseTimeRange(timeSlot, startTime, endTime);

  // Centralized Conflict Engine Check (Application, Officer, Field Officer, Instrument, Center Capacity)
  await checkScheduleConflicts({
    scheduledDate: targetDate,
    startTime: parsedTime.startTime,
    endTime: parsedTime.endTime,
    timeSlot: parsedTime.timeSlot,
    assignedOfficerId,
    assignedFieldOfficerId: fieldOfficer?._id,
    instrumentId: application.instrument,
    verificationCenterId: center?._id,
    applicationId: application._id,
  });

  const resolvedAddress =
    locationAddress ||
    application.verificationLocation?.address ||
    center?.address?.street ||
    'Registered Business Premises';

  const schedule = new VerificationSchedule({
    application: application._id,
    instrument: application.instrument,
    stakeholder: application.stakeholder._id || application.stakeholder,
    assignedOfficer: assignedOfficerId,
    assignedFieldOfficer: fieldOfficer?._id,
    verificationCenter: center?._id,
    assignedGATC: gatcEntity?._id,
    gatc: gatcEntity?._id,
    scheduledDate: targetDate,
    timeSlot: parsedTime.timeSlot,
    startTime: parsedTime.startTime,
    endTime: parsedTime.endTime,
    locationType: locationType || (center ? 'DISTRICT_LABORATORY' : 'ON_SITE_PREMISES'),
    locationAddress: resolvedAddress,
    specialInstructions: specialInstructions || notes,
    notes: notes || specialInstructions,
    status: SCHEDULE_STATUSES.SCHEDULED,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await runInTransaction(async (session) => {
    await schedule.save(session ? { session } : undefined);

    // Update application state to SCHEDULED using workflow engine
    application.assignedLMO = assignedOfficerId;
    await transitionApplicationStatus(
      application,
      APPLICATION_STATUSES.SCHEDULED,
      req.user,
      {
        session,
        remarks: `Verification scheduled for ${targetDate.toLocaleDateString('en-IN')} (${parsedTime.timeSlot}) with officer ${officer.name}`,
      }
    );

    // Statutory Audit Logs inside transaction
    await logAuditEvent(
      {
        user: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.SCHEDULE_CREATED,
        entity: 'VerificationSchedule',
        entityId: schedule._id,
        metadata: {
          applicationNumber: application.applicationNumber,
          officer: officer.name,
          scheduledDate: targetDate.toISOString(),
          timeSlot: parsedTime.timeSlot,
          startTime: parsedTime.startTime,
          endTime: parsedTime.endTime,
        },
      },
      session
    );

    await logAuditEvent(
      {
        user: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email,
        action: AUDIT_ACTIONS.OFFICER_ASSIGNED,
        entity: 'VerificationSchedule',
        entityId: schedule._id,
        metadata: { officerId: officer._id, officerName: officer.name },
      },
      session
    );

    if (fieldOfficer) {
      await logAuditEvent(
        {
          user: req.user._id,
          userRole: req.user.role,
          userEmail: req.user.email,
          action: AUDIT_ACTIONS.FIELD_OFFICER_ASSIGNED,
          entity: 'VerificationSchedule',
          entityId: schedule._id,
          metadata: { fieldOfficerId: fieldOfficer._id, fieldOfficerName: fieldOfficer.name },
        },
        session
      );
    }
  });

  // Post-commit notifications
  if (application.stakeholder?.user) {
    await createNotification({
      recipient: application.stakeholder.user,
      type: NOTIFICATION_TYPES.SCHEDULE_CREATED,
      title: 'Verification Inspection Scheduled',
      message: `Your verification application ${application.applicationNumber} is scheduled for ${targetDate.toLocaleDateString('en-IN')} (${parsedTime.timeSlot}). Inspecting Officer: ${officer.name}.`,
      relatedEntityType: 'Schedule',
      relatedEntityId: schedule._id,
      link: `/applications/${application._id}`,
    });
  }

  await createNotification({
    recipient: officer._id,
    type: NOTIFICATION_TYPES.INSPECTION_ASSIGNED,
    title: 'New Verification Inspection Assigned',
    message: `You have been allocated verification inspection for application ${application.applicationNumber} on ${targetDate.toLocaleDateString('en-IN')} (${parsedTime.timeSlot}).`,
    relatedEntityType: 'Schedule',
    relatedEntityId: schedule._id,
    link: `/inspections/assigned`,
  });

  if (fieldOfficer) {
    await createNotification({
      recipient: fieldOfficer._id,
      type: NOTIFICATION_TYPES.INSPECTION_ASSIGNED,
      title: 'New Field Inspection Assigned',
      message: `You have been assigned as Field Verification Officer for application ${application.applicationNumber} on ${targetDate.toLocaleDateString('en-IN')} (${parsedTime.timeSlot}).`,
      relatedEntityType: 'Schedule',
      relatedEntityId: schedule._id,
      link: `/inspections/assigned`,
    });
  }

  if (center) {
    await logAuditEvent({
      user: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email,
      action: AUDIT_ACTIONS.CENTER_ASSIGNED,
      entity: 'VerificationSchedule',
      entityId: schedule._id,
      metadata: { centerId: center._id, centerName: center.name },
    });
  }

  const populated = await VerificationSchedule.findById(schedule._id)
    .populate('application', 'applicationNumber currentStatus applicationType verificationLocation')
    .populate('instrument', 'instrumentId category serialNumber')
    .populate('stakeholder', 'businessName tradeLicenseNumber')
    .populate('assignedOfficer', 'name email phone designation jurisdiction')
    .populate('assignedFieldOfficer', 'name email phone designation')
    .populate('verificationCenter', 'name code address capacityPerDay');

  return ApiResponse.created(res, populated, 'Verification schedule created successfully');
});

export const rescheduleApplication = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid schedule ID format');
  }

  const {
    scheduledDate,
    newDate,
    date,
    timeSlot,
    startTime,
    endTime,
    reason,
    assignedOfficer,
    assignedOfficerId,
    officerId,
    assignedFieldOfficerId,
    verificationCenterId,
  } = req.body;

  const targetDateInput = scheduledDate || newDate || date;
  if (!targetDateInput) {
    throw ApiError.badRequest('New scheduled verification date is required');
  }
  if (!reason || reason.trim().length < 3) {
    throw ApiError.badRequest('A specific reason for rescheduling (min 3 characters) is required');
  }

  const schedule = await VerificationSchedule.findById(req.params.id)
    .populate('application')
    .populate('assignedOfficer')
    .populate('stakeholder');

  if (!schedule) {
    throw ApiError.notFound('Verification schedule not found');
  }

  if (schedule.status === SCHEDULE_STATUSES.COMPLETED || schedule.status === SCHEDULE_STATUSES.CANCELLED) {
    throw ApiError.badRequest(`Cannot reschedule a ${schedule.status.toLowerCase()} verification appointment.`);
  }

  const targetDate = new Date(targetDateInput);
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest('Invalid new scheduled date provided');
  }

  const parsedTime = parseTimeRange(
    timeSlot || schedule.timeSlot,
    startTime || schedule.startTime,
    endTime || schedule.endTime
  );

  const newOfficerId = assignedOfficer || assignedOfficerId || officerId || schedule.assignedOfficer?._id || schedule.assignedOfficer;
  const newFieldOfficerId = assignedFieldOfficerId || schedule.assignedFieldOfficer;
  const newCenterId = verificationCenterId || schedule.verificationCenter;

  // Check conflicts excluding current schedule
  await checkScheduleConflicts({
    scheduledDate: targetDate,
    startTime: parsedTime.startTime,
    endTime: parsedTime.endTime,
    timeSlot: parsedTime.timeSlot,
    assignedOfficerId: newOfficerId,
    assignedFieldOfficerId: newFieldOfficerId,
    instrumentId: schedule.instrument,
    verificationCenterId: newCenterId,
    applicationId: schedule.application?._id || schedule.application,
    excludeScheduleId: schedule._id,
  });

  // Preserve history
  schedule.rescheduleHistory.push({
    previousDate: schedule.scheduledDate,
    newDate: targetDate,
    previousTimeSlot: schedule.timeSlot,
    newTimeSlot: parsedTime.timeSlot,
    previousStartTime: schedule.startTime,
    newStartTime: parsedTime.startTime,
    previousEndTime: schedule.endTime,
    newEndTime: parsedTime.endTime,
    previousOfficer: schedule.assignedOfficer?._id || schedule.assignedOfficer,
    newOfficer: newOfficerId,
    previousCenter: schedule.verificationCenter,
    newCenter: newCenterId,
    reason: reason.trim(),
    rescheduledBy: req.user._id,
    rescheduledAt: new Date(),
  });

  schedule.scheduledDate = targetDate;
  schedule.timeSlot = parsedTime.timeSlot;
  schedule.startTime = parsedTime.startTime;
  schedule.endTime = parsedTime.endTime;
  if (newOfficerId) schedule.assignedOfficer = newOfficerId;
  if (newFieldOfficerId) schedule.assignedFieldOfficer = newFieldOfficerId;
  if (newCenterId) schedule.verificationCenter = newCenterId;
  schedule.status = SCHEDULE_STATUSES.RESCHEDULED;
  schedule.rescheduleReason = reason.trim();
  schedule.updatedBy = req.user._id;

  await schedule.save();

  // Audit log
  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.SCHEDULE_RESCHEDULED,
    entity: 'VerificationSchedule',
    entityId: schedule._id,
    metadata: {
      newDate: targetDate.toISOString(),
      newTimeSlot: parsedTime.timeSlot,
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      reason: reason.trim(),
    },
  });

  // Notify Stakeholder
  if (schedule.stakeholder?.user) {
    await createNotification({
      recipient: schedule.stakeholder.user,
      type: NOTIFICATION_TYPES.SCHEDULE_CHANGED,
      title: 'Verification Inspection Rescheduled',
      message: `Your verification inspection has been rescheduled to ${targetDate.toLocaleDateString('en-IN')} (${parsedTime.timeSlot}). Reason: ${reason.trim()}`,
      relatedEntityType: 'Schedule',
      relatedEntityId: schedule._id,
      link: `/applications/${schedule.application?._id || schedule.application}`,
    });
  }

  const populated = await VerificationSchedule.findById(schedule._id)
    .populate('application', 'applicationNumber currentStatus')
    .populate('instrument', 'instrumentId category serialNumber')
    .populate('stakeholder', 'businessName tradeLicenseNumber')
    .populate('assignedOfficer', 'name email phone designation');

  return ApiResponse.success(res, populated, 'Verification schedule rescheduled successfully');
});

export const cancelSchedule = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid schedule ID format');
  }

  const reason = req.body.cancellationReason || req.body.reason;
  if (!reason || reason.trim().length < 3) {
    throw ApiError.badRequest('A mandatory cancellation reason (minimum 3 characters) is required.');
  }

  const schedule = await VerificationSchedule.findById(req.params.id);
  if (!schedule) {
    throw ApiError.notFound('Verification schedule not found');
  }

  if (schedule.status === SCHEDULE_STATUSES.COMPLETED) {
    throw ApiError.badRequest('Cannot cancel a completed verification schedule.');
  }
  if (schedule.status === SCHEDULE_STATUSES.CANCELLED) {
    return ApiResponse.success(res, schedule, 'Schedule is already cancelled.');
  }

  await transitionScheduleStatus(schedule, SCHEDULE_STATUSES.CANCELLED, req.user, {
    reason: reason.trim(),
  });

  return ApiResponse.success(res, schedule, 'Verification schedule cancelled successfully');
});

export const updateScheduleStatus = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid schedule ID format');
  }

  const { status, remarks, reason } = req.body;
  if (!status) {
    throw ApiError.badRequest('New status is required.');
  }

  const schedule = await VerificationSchedule.findById(req.params.id);
  if (!schedule) {
    throw ApiError.notFound('Verification schedule not found');
  }

  await transitionScheduleStatus(schedule, status, req.user, { remarks, reason });

  const populated = await VerificationSchedule.findById(schedule._id)
    .populate('application', 'applicationNumber currentStatus')
    .populate('instrument', 'instrumentId category serialNumber')
    .populate('stakeholder', 'businessName tradeLicenseNumber')
    .populate('assignedOfficer', 'name email phone designation');

  return ApiResponse.success(res, populated, `Schedule status updated to ${status}`);
});

export const getSchedules = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};

  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, buildPaginationResponse([], 0, page, limit));
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    filter.$or = [
      { assignedFieldOfficer: req.user._id },
      { assignedOfficer: req.user._id },
    ];
  } else if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    if (req.query.assignedToMe === 'true') {
      filter.assignedOfficer = req.user._id;
    }
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.officerId && mongoose.Types.ObjectId.isValid(req.query.officerId)) {
    filter.assignedOfficer = req.query.officerId;
  }
  if (req.query.applicationId && mongoose.Types.ObjectId.isValid(req.query.applicationId)) {
    filter.application = req.query.applicationId;
  }
  if (req.query.instrumentId && mongoose.Types.ObjectId.isValid(req.query.instrumentId)) {
    filter.instrument = req.query.instrumentId;
  }
  if (req.query.centerId && mongoose.Types.ObjectId.isValid(req.query.centerId)) {
    filter.verificationCenter = req.query.centerId;
  }

  const startDate = req.query.startDate || req.query.fromDate || req.query.start;
  const endDate = req.query.endDate || req.query.toDate || req.query.end;
  if (startDate && endDate) {
    filter.scheduledDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    filter.scheduledDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.scheduledDate = { $lte: new Date(endDate) };
  }

  const [schedules, total] = await Promise.all([
    VerificationSchedule.find(filter)
      .populate('application', 'applicationNumber currentStatus verificationLocation applicationType')
      .populate('instrument', 'instrumentId category serialNumber manufacturer')
      .populate('stakeholder', 'businessName tradeLicenseNumber')
      .populate('assignedOfficer', 'name email phone designation')
      .populate('assignedFieldOfficer', 'name email phone designation')
      .populate('verificationCenter', 'name code address capacityPerDay')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    VerificationSchedule.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    buildPaginationResponse(schedules, total, page, limit),
    'Schedules retrieved successfully'
  );
});

export const getScheduleById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid schedule ID format');
  }

  const schedule = await VerificationSchedule.findById(req.params.id)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder')
    .populate('assignedOfficer', 'name email phone designation jurisdiction')
    .populate('assignedFieldOfficer', 'name email phone designation')
    .populate('verificationCenter', 'name code address capacityPerDay');

  if (!schedule) {
    throw ApiError.notFound('Schedule not found');
  }

  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(schedule.stakeholder?._id || schedule.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to view this schedule.');
    }
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    const isAssigned =
      String(schedule.assignedFieldOfficer?._id || schedule.assignedFieldOfficer || '') === String(req.user._id) ||
      String(schedule.assignedOfficer?._id || schedule.assignedOfficer || '') === String(req.user._id);
    if (!isAssigned) {
      throw ApiError.forbidden('You are not authorized to view this schedule.');
    }
  }

  return ApiResponse.success(res, schedule, 'Schedule retrieved successfully');
});

export const getMySchedules = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, [], 'No schedules found');
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    filter.$or = [
      { assignedFieldOfficer: req.user._id },
      { assignedOfficer: req.user._id },
    ];
  } else {
    filter.assignedOfficer = req.user._id;
  }

  const schedules = await VerificationSchedule.find(filter)
    .populate('application', 'applicationNumber currentStatus')
    .populate('instrument', 'instrumentId category serialNumber')
    .populate('stakeholder', 'businessName tradeLicenseNumber')
    .populate('verificationCenter', 'name code')
    .sort({ scheduledDate: 1 });

  return ApiResponse.success(res, schedules, 'User schedules retrieved successfully');
});

export const getCalendarSchedules = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, []);
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    filter.$or = [
      { assignedFieldOfficer: req.user._id },
      { assignedOfficer: req.user._id },
    ];
  }

  const startDate = req.query.start || req.query.dateFrom || req.query.startDate;
  const endDate = req.query.end || req.query.dateTo || req.query.endDate;

  if (startDate && endDate) {
    filter.scheduledDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    filter.scheduledDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.scheduledDate = { $lte: new Date(endDate) };
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.officerId && mongoose.Types.ObjectId.isValid(req.query.officerId)) {
    filter.assignedOfficer = req.query.officerId;
  }
  if (req.query.centerId && mongoose.Types.ObjectId.isValid(req.query.centerId)) {
    filter.verificationCenter = req.query.centerId;
  }

  const schedules = await VerificationSchedule.find(filter)
    .populate('application', 'applicationNumber currentStatus')
    .populate('instrument', 'instrumentId category serialNumber')
    .populate('assignedOfficer', 'name')
    .populate('verificationCenter', 'name');

  const events = schedules.map((s) => {
    const dateStr = s.scheduledDate.toISOString().split('T')[0];
    const startTimeStr = s.startTime || '09:00';
    const endTimeStr = s.endTime || '12:00';
    return {
      id: s._id,
      title: `LM Verification - ${s.instrument?.category || 'Instrument'} (${s.application?.applicationNumber || ''})`,
      start: `${dateStr}T${startTimeStr}:00.000Z`,
      end: `${dateStr}T${endTimeStr}:00.000Z`,
      status: s.status,
      timeSlot: s.timeSlot,
      startTime: s.startTime,
      endTime: s.endTime,
      applicationNumber: s.application?.applicationNumber,
      officer: s.assignedOfficer?.name,
      center: s.verificationCenter?.name,
      location: s.locationAddress,
      locationType: s.locationType,
    };
  });

  return ApiResponse.success(res, events, 'Calendar schedules retrieved successfully');
});

export const checkAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, timeSlot, officerId, fieldOfficerId, instrumentId, centerId } = req.query;

  if (!date) {
    throw ApiError.badRequest('Date is required to check availability.');
  }

  const availability = await calculateAvailability({
    date,
    startTime,
    endTime,
    timeSlot,
    officerId,
    fieldOfficerId,
    instrumentId,
    centerId,
  });

  return ApiResponse.success(res, availability, 'Availability calculated successfully');
});
