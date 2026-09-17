import mongoose from 'mongoose';

const verificationCenterSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['DISTRICT_LEGAL_METROLOGY_LAB', 'GOVERNMENT_APPROVED_TEST_CENTRE'],
      default: 'DISTRICT_LEGAL_METROLOGY_LAB',
    },
    jurisdiction: {
      state: { type: String, required: true },
      district: { type: String, required: true, index: true },
    },
    address: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    capacityPerDay: {
      type: Number,
      default: 20,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationCenter = mongoose.model(
  'VerificationCenter',
  verificationCenterSchema
);
