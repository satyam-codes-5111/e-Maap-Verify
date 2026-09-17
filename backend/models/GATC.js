import mongoose from 'mongoose';

const gatcSchema = new mongoose.Schema(
  {
    gatcCode: {
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
    accreditationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    accreditationValidUntil: {
      type: Date,
      required: true,
    },
    authorizedCategories: [
      {
        type: String,
      },
    ],
    state: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    contactPerson: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
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

export const GATC = mongoose.model('GATC', gatcSchema);
