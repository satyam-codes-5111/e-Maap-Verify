import mongoose from 'mongoose';
import { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LIST } from '../config/constants.js';

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
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
      unique: true,
      index: true,
    },
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationInspection',
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
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issuedByOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    verificationDate: {
      type: Date,
      default: Date.now,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    verificationType: {
      type: String,
      default: 'INITIAL_VERIFICATION',
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: 'VERIFIED',
    },
    certificateStatus: {
      type: String,
      enum: CERTIFICATE_STATUS_LIST,
      default: CERTIFICATE_STATUSES.ACTIVE,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: CERTIFICATE_STATUS_LIST,
      default: CERTIFICATE_STATUSES.ACTIVE,
      required: true,
      index: true,
    },
    certificateUrl: {
      type: String,
    },
    certificatePdfPath: {
      type: String,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrVerificationToken: {
      type: String,
      index: true,
    },
    qrUrl: {
      type: String,
    },
    qrCodeDataUrl: {
      type: String,
    },
    qrCodeToken: {
      type: String,
      index: true,
    },
    cryptographicHash: {
      type: String,
    },
    pdfUrl: {
      type: String,
    },
    tamperEvidentHash: {
      type: String,
      required: true,
    },
    issuingAuthority: {
      type: String,
      default: 'Department of Consumer Affairs, Legal Metrology Division, Government of India',
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    revocationReason: {
      type: String,
    },
    revocationDetails: {
      revokedAt: { type: Date },
      revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

certificateSchema.methods.getDynamicStatus = function (expiringWindowDays = 30) {
  if (this.certificateStatus === CERTIFICATE_STATUSES.REVOKED || this.status === CERTIFICATE_STATUSES.REVOKED) {
    return CERTIFICATE_STATUSES.REVOKED;
  }
  if (this.certificateStatus === CERTIFICATE_STATUSES.CANCELLED || this.status === CERTIFICATE_STATUSES.CANCELLED) {
    return CERTIFICATE_STATUSES.CANCELLED;
  }
  if (!this.validUntil) {
    return this.certificateStatus || CERTIFICATE_STATUSES.ACTIVE;
  }
  const now = new Date();
  const validUntilDate = new Date(this.validUntil);
  if (validUntilDate.getTime() < now.getTime()) {
    return 'EXPIRED';
  }
  const diffDays = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= expiringWindowDays) {
    return 'EXPIRING_SOON';
  }
  return CERTIFICATE_STATUSES.ACTIVE;
};

certificateSchema.virtual('dynamicStatus').get(function () {
  return this.getDynamicStatus();
});

// Synchronize field aliases on save and validate
certificateSchema.pre('validate', function (next) {
  if (!this.issuedBy && this.issuedByOfficer) {
    this.issuedBy = this.issuedByOfficer;
  }
  if (!this.issuedByOfficer && this.issuedBy) {
    this.issuedByOfficer = this.issuedBy;
  }
  if (!this.issuedAt && this.verificationDate) {
    this.issuedAt = this.verificationDate;
  }
  if (!this.verificationDate && this.issuedAt) {
    this.verificationDate = this.issuedAt;
  }
  if (this.certificateStatus && !this.status) {
    this.status = this.certificateStatus;
  }
  if (this.status && !this.certificateStatus) {
    this.certificateStatus = this.status;
  }
  if (!this.qrToken && this.qrVerificationToken) {
    this.qrToken = this.qrVerificationToken;
  }
  if (!this.qrVerificationToken && this.qrToken) {
    this.qrVerificationToken = this.qrToken;
  }
  if (!this.certificateUrl && this.certificatePdfPath) {
    this.certificateUrl = this.certificatePdfPath;
  }
  if (!this.certificatePdfPath && this.certificateUrl) {
    this.certificatePdfPath = this.certificateUrl;
  }
  if (this.revokedAt && !this.revocationDetails?.revokedAt) {
    this.revocationDetails = {
      revokedAt: this.revokedAt,
      revokedBy: this.revokedBy,
      reason: this.revocationReason,
    };
  }
  if (this.revocationDetails?.revokedAt && !this.revokedAt) {
    this.revokedAt = this.revocationDetails.revokedAt;
    this.revokedBy = this.revocationDetails.revokedBy;
    this.revocationReason = this.revocationDetails.reason;
  }
});

certificateSchema.index({ validUntil: 1, certificateStatus: 1 });
certificateSchema.index({ validUntil: 1, status: 1 });
certificateSchema.index({ stakeholder: 1, certificateStatus: 1 });
certificateSchema.index({ createdAt: -1 });

export const Certificate = mongoose.model('Certificate', certificateSchema);
