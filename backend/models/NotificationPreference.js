import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    inAppEnabled: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    reminderWindows: {
      day60: { type: Boolean, default: true },
      day30: { type: Boolean, default: true },
      day7: { type: Boolean, default: true },
      onExpiry: { type: Boolean, default: true },
    },
    categories: {
      certificateExpiry: { type: Boolean, default: true },
      verificationDue: { type: Boolean, default: true },
      workflowUpdates: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
);
