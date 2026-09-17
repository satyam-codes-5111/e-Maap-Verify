import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { ApiError } from '../utils/ApiError.js';
import { ENV } from '../config/env.js';
import { USER_ROLES, AUDIT_ACTIONS } from '../config/constants.js';
import { logAuditEvent } from './auditService.js';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    ENV.JWT_SECRET,
    {
      expiresIn: ENV.JWT_EXPIRES_IN,
    }
  );
}

export async function loginUser({ email, password, ipAddress, userAgent }) {
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  // Find user and explicitly select password
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    // Record audit event for failed login attempt
    await logAuditEvent({
      user: null,
      userRole: 'ANONYMOUS',
      userEmail: email.toLowerCase().trim(),
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: null,
      ipAddress,
      userAgent,
      metadata: { reason: 'User not found' },
    });
    throw ApiError.unauthorized('Invalid email address or password.');
  }

  if (!user.isActive) {
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: user._id,
      ipAddress,
      userAgent,
      metadata: { reason: 'Account deactivated' },
    });
    throw ApiError.unauthorized('Your account is currently deactivated. Please contact DoCA Administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: user._id,
      ipAddress,
      userAgent,
      metadata: { reason: 'Incorrect password' },
    });
    throw ApiError.unauthorized('Invalid email address or password.');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate JWT
  const token = generateToken(user);

  // Fetch stakeholder profile if applicable
  let stakeholder = null;
  if (user.role === USER_ROLES.BUSINESS_USER) {
    stakeholder = await Stakeholder.findOne({ user: user._id });
  }

  // Record audit log
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.USER_LOGIN,
    entity: 'User',
    entityId: user._id,
    ipAddress,
    userAgent,
  });

  return {
    token,
    role: user.role,
    expiresIn: ENV.JWT_EXPIRES_IN,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      designation: user.designation,
      jurisdiction: user.jurisdiction,
      organization: user.organization,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    },
    stakeholder,
  };
}

export async function registerStakeholderUser({
  name,
  email,
  password,
  phone,
  businessName,
  tradeLicenseNumber,
  gstNumber,
  panNumber,
  businessType,
  registeredAddress,
  contactPerson,
  ipAddress,
  userAgent,
}) {
  // Check if email already registered
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  // Check if trade license already registered
  const existingStakeholder = await Stakeholder.findOne({ tradeLicenseNumber });
  if (existingStakeholder) {
    throw ApiError.conflict('A stakeholder with this trade license number is already registered.');
  }

  // 1. Create User
  const user = new User({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: USER_ROLES.BUSINESS_USER,
    isActive: true,
  });

  await user.save();

  // 2. Create Stakeholder Profile
  const stakeholder = new Stakeholder({
    user: user._id,
    businessName,
    tradeLicenseNumber,
    gstNumber: gstNumber ? gstNumber.toUpperCase() : undefined,
    panNumber: panNumber ? panNumber.toUpperCase() : undefined,
    businessType: businessType || 'RETAILER',
    registeredAddress: registeredAddress || {
      street: 'Main Market Road',
      city: 'District HQ',
      district: 'Central',
      state: 'Delhi',
      pincode: '110001',
    },
    contactPerson: contactPerson || {
      name,
      phone: phone || 'N/A',
      email: email.toLowerCase(),
    },
  });

  await stakeholder.save();

  // Generate JWT
  const token = generateToken(user);

  // Log audit event
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.STAKEHOLDER_CREATED,
    entity: 'Stakeholder',
    entityId: stakeholder._id,
    ipAddress,
    userAgent,
    metadata: { businessName, tradeLicenseNumber },
  });

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    stakeholder,
  };
}

export async function getCurrentUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  let stakeholder = null;
  if (user.role === USER_ROLES.BUSINESS_USER) {
    stakeholder = await Stakeholder.findOne({ user: user._id });
  }

  return {
    user,
    stakeholder,
  };
}

export async function updateUserProfile(userId, updateData) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const allowedFields = ['name', 'phone'];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  }

  await user.save();
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export async function logoutUser({ userId, userRole, userEmail, ipAddress, userAgent }) {
  await logAuditEvent({
    user: userId,
    userRole,
    userEmail,
    action: AUDIT_ACTIONS.USER_LOGOUT,
    entity: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
  });
  return true;
}
