import { z } from 'zod';
import { APPLICATION_TYPE_LIST } from '../config/constants.js';

export const createApplicationSchema = z.object({
  instrumentId: z.string().min(1, 'Target instrument ID is required'),
  applicationType: z.enum(APPLICATION_TYPE_LIST).default('NEW_VERIFICATION'),
  verificationType: z.enum(['INITIAL', 'PERIODICAL', 'RE_VERIFICATION', 'AFTER_REPAIR']).optional(),
  requestedDate: z.string().optional(),
  preferredVerificationDate: z.string().optional(),
  preferredVerificationCenter: z.string().optional(),
  preferredLocation: z.string().optional(),
  verificationLocation: z.object({
    locationType: z.enum(['ON_SITE_PREMISES', 'DISTRICT_LABORATORY', 'GATC_FACILITY']).default('ON_SITE_PREMISES'),
    address: z.string().optional(),
    district: z.string().optional(),
  }).optional(),
  purpose: z.string().optional(),
  remarks: z.string().optional(),
}).passthrough();

export const updateDraftApplicationSchema = createApplicationSchema.partial().passthrough();

export const reviewApplicationSchema = z.object({
  remarks: z.string().optional(),
}).passthrough();

export const approveApplicationSchema = z.object({
  remarks: z.string().optional(),
}).passthrough();

export const rejectApplicationSchema = z.object({
  rejectionReason: z.string().min(3, 'Specific statutory rejection reason is required'),
}).passthrough();

export const scheduleApplicationSchema = z.object({
  applicationId: z.string().min(1, 'Target application ID is required').optional(),
  application: z.string().optional(),
  assignedOfficer: z.string().optional(),
  assignedOfficerId: z.string().optional(),
  officerId: z.string().optional(),
  assignedFieldOfficer: z.string().optional(),
  assignedFieldOfficerId: z.string().optional(),
  fieldOfficerId: z.string().optional(),
  scheduledDate: z.string().optional(),
  verificationDate: z.string().optional(),
  date: z.string().optional(),
  timeSlot: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  verificationCenter: z.string().optional(),
  verificationCenterId: z.string().optional(),
  centerId: z.string().optional(),
  assignedGATC: z.string().optional(),
  gatcId: z.string().optional(),
  gatc: z.string().optional(),
  locationType: z.enum(['ON_SITE_PREMISES', 'DISTRICT_LABORATORY', 'GATC_FACILITY']).default('ON_SITE_PREMISES'),
  locationAddress: z.string().optional(),
  specialInstructions: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();

export const rescheduleApplicationSchema = z.object({
  scheduledDate: z.string().optional(),
  newDate: z.string().optional(),
  date: z.string().optional(),
  timeSlot: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  assignedOfficer: z.string().optional(),
  assignedOfficerId: z.string().optional(),
  officerId: z.string().optional(),
  assignedFieldOfficerId: z.string().optional(),
  fieldOfficerId: z.string().optional(),
  verificationCenterId: z.string().optional(),
  centerId: z.string().optional(),
  reason: z.string().min(3, 'Rescheduling reason is required'),
}).passthrough();

export const cancelScheduleSchema = z.object({
  reason: z.string().optional(),
  cancellationReason: z.string().optional(),
}).passthrough();
