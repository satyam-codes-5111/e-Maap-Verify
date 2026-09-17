import { z } from 'zod';
import { VERIFICATION_VERDICT_LIST } from '../config/constants.js';

export const inspectionSubmissionSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  gpsCoordinates: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    accuracyMeters: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  instrumentCondition: z.object({
    visualCheckPassed: z.boolean().default(true),
    levelingBubbleCentered: z.boolean().default(true),
    modelApprovalPlateIntact: z.boolean().default(true),
    zeroTrackingOperational: z.boolean().default(true),
  }),
  standardsUsed: z.array(
    z.object({
      standardId: z.string().min(1, 'Standard working weight ID is required'),
      denomination: z.string().min(1, 'Weight denomination is required'),
      calibrationValidUntil: z.string().min(1, 'Calibration validity date is required'),
    })
  ).min(1, 'At least one calibrated standard weight must be recorded'),
  measurementReadings: z.array(
    z.object({
      testType: z.string().min(1, 'Test type name is required'),
      appliedLoad: z.number(),
      indicatedReading: z.number(),
      intrinsicError: z.number(),
      maximumPermissibleError: z.number(),
      isCompliant: z.boolean(),
    })
  ).min(1, 'At least one statutory metrological test reading must be recorded'),
  stampingAndSealing: z.object({
    leadSealsApplied: z.number().int().min(0),
    hologramStickerNumber: z.string().optional(),
    stampingYearMark: z.string().optional(),
    sealingPlugsIntact: z.boolean().default(true),
  }),
  remarks: z.string().optional(),
});

export const verificationVerdictSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  inspectionId: z.string().min(1, 'Inspection ID is required'),
  verdict: z.enum(VERIFICATION_VERDICT_LIST),
  complianceInformation: z.object({
    allMpeCompliant: z.boolean(),
    statutorySealAffixed: z.boolean(),
  }),
  rejectionReasons: z.array(z.string()).optional(),
  officerRemarks: z.string().optional(),
});

export const finalizeInspectionSchema = z.object({
  result: z.enum(['VERIFIED', 'REJECTED', 'PASS', 'FAIL']).optional(),
  verdict: z.enum(['VERIFIED', 'REJECTED', 'PASS', 'FAIL']).optional(),
  reason: z.string().optional(),
  observations: z.string().optional(),
  defects: z.array(z.any()).optional(),
  correctiveAction: z.string().optional(),
  officerRemarks: z.string().optional(),
  complianceInformation: z
    .object({
      allMpeCompliant: z.boolean().optional(),
      statutorySealAffixed: z.boolean().optional(),
    })
    .optional(),
});

export const reopenInspectionSchema = z.object({
  reason: z.string().min(3, 'Reopen justification reason is required'),
});
