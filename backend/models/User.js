import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, USER_ROLE_LIST } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Never return password by default
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLE_LIST,
        message: '{VALUE} is not a recognized system role',
      },
      default: USER_ROLES.BUSINESS_USER,
      index: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    jurisdiction: {
      state: { type: String, trim: true },
      district: { type: String, trim: true, index: true },
      zone: { type: String, trim: true },
    },
    organization: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for role-based queries
userSchema.index({ role: 1, isActive: 1 });

// Pre-save hook to hash password before persisting
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for status string representation
userSchema.virtual('status').get(function () {
  return this.isActive ? 'ACTIVE' : 'INACTIVE';
});

// Safe transform to remove sensitive fields when serialized
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.__v;
  obj.status = this.isActive ? 'ACTIVE' : 'INACTIVE';
  return obj;
};

export const User = mongoose.model('User', userSchema);
