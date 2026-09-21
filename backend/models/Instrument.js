import mongoose from 'mongoose';
import {
  INSTRUMENT_STATUSES,
  INSTRUMENT_STATUS_LIST,
  INSTRUMENT_CATEGORIES,
  INSTRUMENT_CATEGORY_LIST,
  ACCURACY_CLASSES,
  ACCURACY_CLASS_LIST,
} from '../config/constants.js';

const instrumentSchema = new mongoose.Schema(
  {
    instrumentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    stakeholder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stakeholder',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: INSTRUMENT_CATEGORY_LIST,
      default: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      required: true,
      index: true,
    },
    instrumentType: {
      type: String,
      required: [true, 'Instrument type or specification is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true,
      index: true,
    },
    modelNumber: {
      type: String,
      required: [true, 'Model number is required'],
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      trim: true,
      index: true,
    },
    capacity: {
      value: { type: Number, required: true },
      unit: { type: String, required: true, default: 'kg' }, // kg, g, mg, tonnes, litres, metres
    },
    accuracyClass: {
      type: String,
      enum: ACCURACY_CLASS_LIST,
      default: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      required: true,
    },
    verificationScaleInterval_e: {
      type: String,
      required: true, // e.g. "2g", "10g", "0.01g"
    },
    minimumCapacity_Min: {
      type: String, // e.g. "100g", "40kg"
    },
    dateOfManufacture: {
      type: Date,
    },
    installationAddress: {
      premiseName: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true, index: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    status: {
      type: String,
      enum: INSTRUMENT_STATUS_LIST,
      default: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
      index: true,
    },
    verificationFrequencyMonths: {
      type: Number,
      default: 12,
    },
    lastVerificationDate: {
      type: Date,
    },
    nextVerificationDueDate: {
      type: Date,
      index: true,
    },
    remarks: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    photographs: [
      {
        caption: { type: String },
        fileName: { type: String },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    documents: [
      {
        title: { type: String },
        docType: { type: String, default: 'SUPPORTING_DOCUMENT' },
        fileName: { type: String },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

instrumentSchema.methods.getDueStatus = function (reminderThresholdDays = 30) {
  if (!this.nextVerificationDueDate) {
    return 'UP_TO_DATE';
  }
  const now = new Date();
  const dueDate = new Date(this.nextVerificationDueDate);
  if (dueDate.getTime() < now.getTime()) {
    return 'OVERDUE';
  }
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= reminderThresholdDays) {
    return 'DUE_SOON';
  }
  return 'UP_TO_DATE';
};

instrumentSchema.virtual('dueStatus').get(function () {
  return this.getDueStatus();
});

// Compound indexes
instrumentSchema.index({ manufacturer: 1, serialNumber: 1 });
instrumentSchema.index({ stakeholder: 1, status: 1 });
instrumentSchema.index({ stakeholder: 1, nextVerificationDueDate: 1 });
instrumentSchema.index({ stakeholder: 1, createdAt: -1 });
instrumentSchema.index({ 'installationAddress.district': 1, status: 1 });
instrumentSchema.index({ nextVerificationDueDate: 1, status: 1 });
instrumentSchema.index({ createdAt: -1 });
instrumentSchema.index({ instrumentType: 1 });

export const Instrument = mongoose.model('Instrument', instrumentSchema);
