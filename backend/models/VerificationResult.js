import mongoose from 'mongoose';
import { VERIFICATION_VERDICTS, VERIFICATION_VERDICT_LIST } from '../config/constants.js';

const verificationResultSchema = new mongoose.Schema(
  {
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
      required: true,
      unique: true,
      index: true,
    },
    instrument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instrument',
      required: true,
      index: true,
    },
    result: {
      type: String,
      enum: VERIFICATION_VERDICT_LIST,
      default: VERIFICATION_VERDICTS.PASS,
      required: true,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verificationDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    nextDueDate: {
      type: Date,
      required: true,
      index: true,
    },
    complianceInformation: {
      allMpeCompliant: { type: Boolean, required: true },
      statutorySealAffixed: { type: Boolean, required: true },
    },
    rejectionReasons: [
      {
        type: String,
      },
    ],
    officerRemarks: {
      type: String,
    },
    digitalSignatureHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationResult = mongoose.model(
  'VerificationResult',
  verificationResultSchema
);
