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

export async function loginUser({ email, password, selectedRole, ipAddress, userAgent }) {
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  // Find user and select password plus required fields only
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password _id name email phone role designation jurisdiction organization isActive lastLogin');

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

  // If client supplied selectedRole, validate role before proceeding to token generation and audit logging
  if (selectedRole && user.role !== selectedRole) {
    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: user._id,
      ipAddress,
      userAgent,
      metadata: { reason: 'Role mismatch', requestedRole: selectedRole, actualRole: user.role },
    });
    throw ApiError.unauthorized('Selected role does not match this account.');
  }

  const now = new Date();
  user.lastLogin = now;

  // Generate JWT
  const token = generateToken(user);

  // Parallelize lastLogin update, lean stakeholder profile fetch, and audit log write
  const [_, stakeholder] = await Promise.all([
    User.updateOne({ _id: user._id }, { $set: { lastLogin: now } }),
    user.role === USER_ROLES.BUSINESS_USER
      ? Stakeholder.findOne({ user: user._id }).lean()
      : null,
    logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      entityId: user._id,
      ipAddress,
      userAgent,
    }),
  ]);

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
      lastLogin: now,
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
  role,
  ipAddress,
  userAgent,
}) {
  // STRICT RULE: Reject any attempt to register an admin, super admin, or officer role
  if (role && role !== USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden(
      'Public registration is strictly permitted for Business Users only. Administrative and Officer accounts cannot be created publicly.'
    );
  }

  // Check if email already registered
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  // Ensure unique trade license number
  const finalTradeLicense = (tradeLicenseNumber && tradeLicenseNumber.trim())
    ? tradeLicenseNumber.trim().toUpperCase()
    : `TL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const existingStakeholder = await Stakeholder.findOne({ tradeLicenseNumber: finalTradeLicense });
  if (existingStakeholder) {
    throw ApiError.conflict('A stakeholder with this trade license number is already registered.');
  }

  // 1. Create User - STRICTLY set to BUSINESS_USER (never trust client role)
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password, // Handled by existing User pre-save bcrypt hook (12 rounds)
    phone: phone ? phone.trim() : undefined,
    role: USER_ROLES.BUSINESS_USER, // HARD-CODED STRICT ENFORCEMENT
    isActive: true,
  });

  await user.save();

  // Normalize businessType
  let bType = (businessType || 'RETAILER').toUpperCase();
  if (bType === 'RETAIL') bType = 'RETAILER';
  const validBusinessTypes = [
    'MANUFACTURER',
    'DEALER',
    'REPAIRER',
    'PETROL_PUMP',
    'RETAILER',
    'INDUSTRIAL_WEIGHBRIDGE',
    'JEWELER',
    'OTHER',
  ];
  if (!validBusinessTypes.includes(bType)) {
    bType = 'RETAILER';
  }

  // Safe defaults for address if partial
  const address = {
    street: registeredAddress?.street?.trim() || 'Main Market Road',
    city: registeredAddress?.city?.trim() || 'District HQ',
    district: registeredAddress?.district?.trim() || 'Central District',
    state: registeredAddress?.state?.trim() || 'Delhi',
    pincode: registeredAddress?.pincode?.trim() || '110001',
  };

  // 2. Create Stakeholder Profile
  const stakeholder = new Stakeholder({
    user: user._id,
    businessName: businessName.trim(),
    tradeLicenseNumber: finalTradeLicense,
    gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : undefined,
    panNumber: panNumber ? panNumber.trim().toUpperCase() : undefined,
    businessType: bType,
    registeredAddress: address,
    contactPerson: contactPerson || {
      name: name.trim(),
      phone: phone ? phone.trim() : 'N/A',
      email: normalizedEmail,
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
    metadata: { businessName, tradeLicenseNumber: finalTradeLicense },
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
