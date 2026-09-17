import mongoose from 'mongoose';
import { SCHEDULE_STATUSES, SCHEDULE_STATUS_LIST } from '../config/constants.js';

const rescheduleRecordSchema = new mongoose.Schema(
  {
    previousDate: { type: Date, required: true },
    newDate: { type: Date, required: true },
    previousTimeSlot: { type: String },
    newTimeSlot: { type: String },
    previousStartTime: { type: String },
    newStartTime: { type: String },
    previousEndTime: { type: String },
    newEndTime: { type: String },
    previousOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    newOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'VerificationCenter' },
    newCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'VerificationCenter' },
    reason: { type: String, required: true },
    rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rescheduledAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const verificationScheduleSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationApplication',
      required: true,
      index: true,
    },
    instrument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instrument',
      required: true,
      index: true,
    },
    stakeholder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stakeholder',
      required: true,
      index: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedFieldOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedGATC: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GATC',
      index: true,
    },
    gatc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GATC',
    },
    verificationCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationCenter',
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      default: '09:00 - 12:00',
    },
    startTime: {
      type: String,
      default: '09:00',
    },
    endTime: {
      type: String,
      default: '12:00',
    },
    locationType: {
      type: String,
      enum: ['ON_SITE_PREMISES', 'DISTRICT_LABORATORY', 'GATC_FACILITY'],
      default: 'ON_SITE_PREMISES',
    },
    locationAddress: {
      type: String,
      required: true,
    },
    specialInstructions: {
      type: String,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: SCHEDULE_STATUS_LIST,
      default: SCHEDULE_STATUSES.SCHEDULED,
      index: true,
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: {
      type: Date,
    },
    rescheduleReason: {
      type: String,
    },
    rescheduleHistory: [rescheduleRecordSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases
verificationScheduleSchema.virtual('verificationDate')
  .get(function () {
    return this.scheduledDate;
  })
  .set(function (val) {
    this.scheduledDate = val;
  });

verificationScheduleSchema.virtual('location')
  .get(function () {
    return this.locationAddress;
  })
  .set(function (val) {
    this.locationAddress = val;
  });

verificationScheduleSchema.virtual('scheduleStatus')
  .get(function () {
    return this.status;
  })
  .set(function (val) {
    this.status = val;
  });

// Compound indexes for conflict detection and fast querying
verificationScheduleSchema.index({ assignedOfficer: 1, scheduledDate: 1, status: 1 });
verificationScheduleSchema.index({ assignedFieldOfficer: 1, scheduledDate: 1, status: 1 });
verificationScheduleSchema.index({ instrument: 1, scheduledDate: 1, status: 1 });
verificationScheduleSchema.index({ application: 1, status: 1 });
verificationScheduleSchema.index({ verificationCenter: 1, scheduledDate: 1, status: 1 });
verificationScheduleSchema.index({ assignedGATC: 1, scheduledDate: 1, status: 1 });
verificationScheduleSchema.index({ scheduledDate: 1, status: 1 });

export const VerificationSchedule = mongoose.model(
  'VerificationSchedule',
  verificationScheduleSchema
);
