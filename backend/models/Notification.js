import mongoose from 'mongoose';
import {
  NOTIFICATION_TYPE_LIST,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_PRIORITY_LIST,
} from '../config/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_LIST,
      default: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    instrument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instrument',
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationApplication',
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    relatedEntityType: {
      type: String,
      trim: true,
      index: true,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITY_LIST,
      default: NOTIFICATION_PRIORITIES.MEDIUM,
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, priority: 1, createdAt: -1 });
notificationSchema.index({ relatedEntityType: 1, relatedEntityId: 1, type: 1 });
notificationSchema.index({ recipient: 1, instrument: 1, type: 1, dueDate: 1 });
notificationSchema.index({ instrument: 1, type: 1 });
notificationSchema.index({ instrument: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
