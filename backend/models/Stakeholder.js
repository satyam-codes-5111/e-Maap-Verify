import mongoose from 'mongoose';

const stakeholderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Legal business or trading name is required'],
      trim: true,
      index: true,
    },
    tradeLicenseNumber: {
      type: String,
      required: [true, 'Trade license or registration number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    businessType: {
      type: String,
      enum: [
        'MANUFACTURER',
        'DEALER',
        'REPAIRER',
        'PETROL_PUMP',
        'RETAILER',
        'INDUSTRIAL_WEIGHBRIDGE',
        'JEWELER',
        'OTHER',
      ],
      default: 'RETAILER',
      required: true,
    },
    registeredAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true, index: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    contactPerson: {
      name: { type: String, required: true },
      designation: { type: String },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    kycDocuments: [
      {
        docType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileName: { type: String },
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    kycStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    kycRemarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

stakeholderSchema.index({ createdAt: -1 });

export const Stakeholder = mongoose.model('Stakeholder', stakeholderSchema);
