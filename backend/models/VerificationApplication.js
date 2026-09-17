import mongoose from 'mongoose';
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LIST,
  APPLICATION_TYPES,
  APPLICATION_TYPE_LIST,
} from '../config/constants.js';

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const verificationApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
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
    instrument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instrument',
      required: true,
      index: true,
    },
    applicationType: {
      type: String,
      enum: APPLICATION_TYPE_LIST,
      default: APPLICATION_TYPES.NEW_VERIFICATION,
      required: true,
      index: true,
    },
    verificationType: {
      type: String,
      enum: ['INITIAL', 'PERIODICAL', 'RE_VERIFICATION', 'AFTER_REPAIR'],
      default: 'INITIAL',
    },
    currentStatus: {
      type: String,
      enum: APPLICATION_STATUS_LIST,
      default: APPLICATION_STATUSES.DRAFT,
      required: true,
      index: true,
    },
    assignedLMO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedGATC: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GATC',
      index: true,
    },
    submissionDate: {
      type: Date,
      index: true,
    },
    submittedAt: {
      type: Date,
      index: true,
    },
    preferredVerificationDate: {
      type: Date,
    },
    requestedDate: {
      type: Date,
    },
    preferredVerificationCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationCenter',
    },
    preferredLocation: {
      type: String,
    },
    verificationLocation: {
      locationType: {
        type: String,
        enum: ['ON_SITE_PREMISES', 'DISTRICT_LABORATORY', 'GATC_FACILITY'],
        default: 'ON_SITE_PREMISES',
      },
      address: { type: String },
      district: { type: String, index: true },
    },
    purpose: {
      type: String,
    },
    remarks: {
      type: String,
    },
    reviewRemarks: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    documents: [
      {
        title: { type: String, required: true },
        docType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    feeDetails: {
      amount: { type: Number, default: 500 },
      paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'EXEMPTED'], default: 'PENDING' },
      transactionRef: { type: String },
      paidAt: { type: Date },
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias: applicationStatus mirrors currentStatus
verificationApplicationSchema.virtual('applicationStatus')
  .get(function () {
    return this.currentStatus;
  })
  .set(function (val) {
    this.currentStatus = val;
  });

// Virtual alias: uploadedDocuments mirrors documents
verificationApplicationSchema.virtual('uploadedDocuments')
  .get(function () {
    return this.documents;
  });

verificationApplicationSchema.index({ stakeholder: 1, currentStatus: 1 });
verificationApplicationSchema.index({ instrument: 1, currentStatus: 1 });
verificationApplicationSchema.index({ assignedLMO: 1, currentStatus: 1 });
verificationApplicationSchema.index({ createdAt: -1 });

export const VerificationApplication = mongoose.model(
  'VerificationApplication',
  verificationApplicationSchema
);
