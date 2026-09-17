import mongoose from 'mongoose';
import {
  INSPECTION_STATUSES,
  INSPECTION_STATUS_LIST,
  INSPECTION_RESULTS,
  INSPECTION_RESULT_LIST,
  DEFECT_SEVERITIES,
  DEFECT_SEVERITY_LIST,
} from '../config/constants.js';

const measurementReadingSchema = new mongoose.Schema(
  {
    testType: { type: String, required: true },
    appliedLoad: { type: Number, required: true },
    indicatedReading: { type: Number, required: true },
    intrinsicError: { type: Number, required: true },
    maximumPermissibleError: { type: Number, required: true },
    isCompliant: { type: Boolean, required: true },
  },
  { _id: false }
);

const instrumentReadingSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true },
    standardValue: { type: Number, required: true },
    observedValue: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    tolerance: { type: Number, default: 0 },
    deviation: { type: Number, default: 0 },
    result: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' },
    remarks: { type: String },
  },
  { _id: false }
);

const accuracyCheckSchema = new mongoose.Schema(
  {
    checkName: { type: String, required: true },
    expectedValue: { type: Number },
    observedValue: { type: Number },
    unit: { type: String },
    tolerance: { type: Number },
    status: { type: String, enum: ['PASS', 'FAIL', 'NOT_APPLICABLE'], default: 'PASS' },
    remarks: { type: String },
  },
  { _id: false }
);

const complianceCheckSchema = new mongoose.Schema(
  {
    checkName: { type: String, required: true },
    status: { type: String, enum: ['PASS', 'FAIL', 'NOT_APPLICABLE'], default: 'PASS' },
    remarks: { type: String },
  },
  { _id: false }
);

const defectSchema = new mongoose.Schema(
  {
    defectType: { type: String, required: true },
    severity: { type: String, enum: DEFECT_SEVERITY_LIST, default: DEFECT_SEVERITIES.LOW },
    description: { type: String, required: true },
    relatedRequirement: { type: String },
    correctiveAction: { type: String },
    status: { type: String, enum: ['IDENTIFIED', 'RECTIFIED', 'WAIVED'], default: 'IDENTIFIED' },
  },
  { _id: false }
);

const verificationInspectionSchema = new mongoose.Schema(
  {
    inspectionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationApplication',
      required: true,
      index: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationSchedule',
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
      index: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    verificationCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationCenter',
      index: true,
    },
    gatc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GATC',
      index: true,
    },
    inspectionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    visitDateTime: {
      type: Date,
      default: Date.now,
    },
    startTime: { type: Date },
    endTime: { type: Date },
    inspectionStatus: {
      type: String,
      enum: INSPECTION_STATUS_LIST,
      default: INSPECTION_STATUSES.DRAFT,
      required: true,
      index: true,
    },
    inspectionType: {
      type: String,
      enum: ['INITIAL', 'PERIODICAL', 'RE_VERIFICATION', 'AFTER_REPAIR', 'SURPRISE'],
      default: 'INITIAL',
    },
    location: { type: String },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    gpsCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracyMeters: { type: Number },
      address: { type: String },
    },
    observations: { type: String },
    instrumentCondition: {
      visualCheckPassed: { type: Boolean, default: true },
      levelingBubbleCentered: { type: Boolean, default: true },
      modelApprovalPlateIntact: { type: Boolean, default: true },
      zeroTrackingOperational: { type: Boolean, default: true },
      notes: { type: String },
    },
    standardReference: [
      {
        standardId: { type: String, required: true },
        denomination: { type: String, required: true },
        calibrationValidUntil: { type: Date, required: true },
      },
    ],
    standardsUsed: [
      {
        standardId: { type: String, required: true },
        denomination: { type: String, required: true },
        calibrationValidUntil: { type: Date, required: true },
      },
    ],
    instrumentReadings: [instrumentReadingSchema],
    measurementReadings: [measurementReadingSchema],
    accuracyChecks: [accuracyCheckSchema],
    complianceChecks: [complianceCheckSchema],
    defects: [defectSchema],
    nonCompliance: [{ type: String }],
    inspectorRemarks: { type: String },
    stakeholderRemarks: { type: String },
    remarks: { type: String },
    stampingAndSealing: {
      leadSealsApplied: { type: Number, default: 1 },
      hologramStickerNumber: { type: String },
      stampingYearMark: { type: String },
      sealingPlugsIntact: { type: Boolean, default: true },
    },
    photographs: [
      {
        caption: { type: String },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    photos: [
      {
        caption: { type: String },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    uploadedDocuments: [
      {
        title: { type: String },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    result: {
      type: String,
      enum: INSPECTION_RESULT_LIST,
      default: INSPECTION_RESULTS.PENDING,
      index: true,
    },
    resultRemarks: { type: String },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    verifiedAt: { type: Date },
    submittedAt: { type: Date },
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
  }
);

// Performance compound indexes
verificationInspectionSchema.index({ assignedOfficer: 1, inspectionStatus: 1 });
verificationInspectionSchema.index({ stakeholder: 1, inspectionStatus: 1 });
verificationInspectionSchema.index({ schedule: 1, inspectionStatus: 1 });
verificationInspectionSchema.index({ inspectionDate: -1 });

export const VerificationInspection = mongoose.model(
  'VerificationInspection',
  verificationInspectionSchema
);
