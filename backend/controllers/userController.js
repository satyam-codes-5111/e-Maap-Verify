import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import { USER_ROLES, AUDIT_ACTIONS } from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';
import { escapeRegex } from '../utils/securityUtils.js';

/**
 * @desc    Get paginated users list with filters
 * @route   GET /api/admin/users or GET /api/users
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);

  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }
  if (req.query.district) {
    filter['jurisdiction.district'] = new RegExp(escapeRegex(req.query.district), 'i');
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { phone: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    buildPaginationResponse(users, total, page, limit),
    'Users retrieved successfully'
  );
});

/**
 * @desc    Create a new departmental or platform user
 * @route   POST /api/admin/users or POST /api/users
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, designation, jurisdiction, organization } = req.body;

  // Prevent privilege escalation: only SUPER_ADMIN can create another SUPER_ADMIN or ADMIN
  if (req.user.role !== USER_ROLES.SUPER_ADMIN && (role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.ADMIN)) {
    throw ApiError.forbidden('Only Super Administrators are permitted to provision Admin or Super Admin accounts.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict(`A user with email '${normalizedEmail}' already exists.`);
  }

  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : undefined,
    role,
    designation,
    jurisdiction,
    organization,
    isActive: true,
  });

  await user.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_CREATED,
    entity: 'User',
    entityId: user._id,
    metadata: { createdRole: role, email: user.email },
  });

  return ApiResponse.created(res, user, 'User created successfully');
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/admin/users/:id or GET /api/users/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getUserById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid user ID format.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, user, 'User retrieved successfully');
});

/**
 * @desc    Update user details
 * @route   PUT /api/admin/users/:id or PATCH /api/admin/users/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const updateUser = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid user ID format.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Prevent non-super-admins from modifying Super Administrator accounts
  if (user.role === USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw ApiError.forbidden('Only Super Administrators can modify Super Administrator accounts.');
  }

  // Prevent unauthorized role escalation
  if (req.body.role && req.body.role !== user.role) {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Administrators are permitted to modify user roles.');
    }
    if (String(req.user._id) === String(user._id)) {
      throw ApiError.forbidden('Administrators cannot change their own administrative role.');
    }
    user.role = req.body.role;
  }

  // Handle email update and uniqueness
  if (req.body.email) {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (duplicate) {
        throw ApiError.conflict(`A user with email '${normalizedEmail}' already exists.`);
      }
      user.email = normalizedEmail;
    }
  }

  // Handle password update
  if (req.body.password) {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN && String(req.user._id) !== String(user._id)) {
      throw ApiError.forbidden('Only Super Administrators or the user themselves can update passwords.');
    }
    user.password = req.body.password; // Triggers pre-save bcrypt hash
  }

  // Allowed profile updates
  const allowedUpdates = ['name', 'phone', 'designation', 'jurisdiction', 'organization', 'isActive'];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_UPDATED,
    entity: 'User',
    entityId: user._id,
    metadata: { updatedFields: Object.keys(req.body) },
  });

  return ApiResponse.success(res, user, 'User updated successfully');
});

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid user ID format.');
  }

  if (String(req.user._id) === String(req.params.id)) {
    throw ApiError.badRequest('Administrators cannot deactivate their own active account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Non-super-admins cannot deactivate super-admins
  if (user.role === USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw ApiError.forbidden('Only Super Administrators can modify Super Administrator status.');
  }

  // Prevent deactivating the last active SUPER_ADMIN
  const targetStatus = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
  if (!targetStatus && user.role === USER_ROLES.SUPER_ADMIN) {
    const activeSuperAdmins = await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN, isActive: true });
    if (activeSuperAdmins <= 1) {
      throw ApiError.badRequest('Cannot deactivate the last active Super Administrator.');
    }
  }

  user.isActive = targetStatus;
  await user.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
    entity: 'User',
    entityId: user._id,
    metadata: { isActive: user.isActive },
  });

  return ApiResponse.success(res, user, `User status updated to ${user.isActive ? 'Active' : 'Inactive'}`);
});

/**
 * @desc    Safe user deactivation / soft deletion
 * @route   DELETE /api/admin/users/:id or DELETE /api/users/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const deleteOrDeactivateUser = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid user ID format.');
  }

  if (String(req.user._id) === String(req.params.id)) {
    throw ApiError.badRequest('Administrators cannot deactivate their own active account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.role === USER_ROLES.SUPER_ADMIN && req.user.role !== USER_ROLES.SUPER_ADMIN) {
    throw ApiError.forbidden('Only Super Administrators can deactivate another Super Administrator.');
  }

  if (user.role === USER_ROLES.SUPER_ADMIN) {
    const activeSuperAdmins = await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN, isActive: true });
    if (activeSuperAdmins <= 1) {
      throw ApiError.badRequest('Cannot deactivate the last active Super Administrator.');
    }
  }

  user.isActive = false;
  await user.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
    entity: 'User',
    entityId: user._id,
    metadata: { action: 'DEACTIVATED_VIA_DELETE_ENDPOINT' },
  });

  return ApiResponse.success(res, user, 'User account deactivated successfully');
});

/**
 * @desc    Get active officers list for assignment
 * @route   GET /api/users/officers/list or GET /api/admin/users/officers/list
 * @access  Private (ADMIN, LMO)
 */
export const getActiveOfficers = asyncHandler(async (req, res) => {
  const officers = await User.find({
    role: {
      $in: [
        USER_ROLES.LEGAL_METROLOGY_OFFICER,
        USER_ROLES.FIELD_VERIFICATION_OFFICER,
        USER_ROLES.GATC_OFFICER,
      ],
    },
    isActive: true,
  }).select('name email phone role designation jurisdiction');

  return ApiResponse.success(res, officers, 'Active officers list retrieved');
});
