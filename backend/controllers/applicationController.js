import mongoose from 'mongoose';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Instrument } from '../models/Instrument.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { Certificate } from '../models/Certificate.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  INSTRUMENT_STATUSES,
  AUDIT_ACTIONS,
} from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';
import { escapeRegex } from '../utils/securityUtils.js';
import { transitionApplicationStatus } from '../services/applicationWorkflowService.js';
import { cleanupFile, validateUploadedFile, sanitizeFileName } from '../utils/fileSecurity.js';

export const createApplication = asyncHandler(async (req, res) => {
  const {
    instrumentId,
    applicationType,
    verificationType,
    requestedDate,
    preferredVerificationDate,
    preferredVerificationCenter,
    preferredLocation,
    verificationLocation,
    purpose,
    remarks,
  } = req.body;

  // Reject client-supplied protected administrative and privilege escalation fields
  const forbiddenFields = [
    'applicationStatus',
    'currentStatus',
    'status',
    'reviewedBy',
    'reviewedAt',
    'approvedBy',
    'certificateId',
    'verificationResult',
    'role',
    'permissions',
    'isAdmin',
    'isSuperAdmin',
    'verificationStatus',
    'certificateStatus',
    'ownership',
    'stakeholder',
    'stakeholderId',
    'officerId',
    'jurisdiction',
  ];
  for (const field of forbiddenFields) {
    if (req.body[field] !== undefined) {
      throw ApiError.badRequest(`Directly specifying protected field '${field}' is not permitted.`);
    }
  }

  if (!instrumentId || !mongoose.Types.ObjectId.isValid(instrumentId)) {
    throw ApiError.badRequest('A valid instrument ID is required.');
  }

  // Derive stakeholder strictly from authenticated user
  let stakeholder = null;
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      throw ApiError.badRequest('Please complete your stakeholder business profile before applying for verification.');
    }
  } else {
    // Admin creating on behalf of a stakeholder
    const sId = req.body.stakeholderId || req.body.stakeholder;
    if (!sId || !mongoose.Types.ObjectId.isValid(sId)) {
      throw ApiError.badRequest('Valid stakeholderId is required for administrative application creation.');
    }
    stakeholder = await Stakeholder.findById(sId);
    if (!stakeholder) {
      throw ApiError.notFound('Associated stakeholder business profile not found');
    }
  }

  // Verify instrument exists and belongs to stakeholder
  const instrument = await Instrument.findById(instrumentId);
  if (!instrument) {
    throw ApiError.notFound('Instrument not found');
  }

  if (String(instrument.stakeholder) !== String(stakeholder._id)) {
    throw ApiError.forbidden('You can only apply for verification of your own registered instruments.');
  }

  if (!instrument.isActive || instrument.status === INSTRUMENT_STATUSES.OUT_OF_SERVICE) {
    throw ApiError.badRequest('Cannot apply for verification of an inactive or out-of-service instrument.');
  }

  // Generate dynamic unique Application Number: LM-YYYY-XXXXXX
  const year = new Date().getFullYear();
  let applicationNumber = '';
  let isUnique = false;
  while (!isUnique) {
    const randSuffix = Math.floor(100000 + Math.random() * 900000);
    applicationNumber = `LM-${year}-${randSuffix}`;
    const exists = await VerificationApplication.findOne({ applicationNumber });
    if (!exists) isUnique = true;
  }

  const effectiveRequestedDate = requestedDate || preferredVerificationDate;

  const application = new VerificationApplication({
    applicationNumber,
    stakeholder: stakeholder._id,
    instrument: instrument._id,
    applicationType: applicationType || 'NEW_VERIFICATION',
    verificationType: verificationType || 'INITIAL',
    currentStatus: APPLICATION_STATUSES.DRAFT,
    requestedDate: effectiveRequestedDate ? new Date(effectiveRequestedDate) : undefined,
    preferredVerificationDate: effectiveRequestedDate ? new Date(effectiveRequestedDate) : undefined,
    preferredVerificationCenter: preferredVerificationCenter && mongoose.Types.ObjectId.isValid(preferredVerificationCenter)
      ? preferredVerificationCenter
      : undefined,
    preferredLocation: preferredLocation || (verificationLocation?.address ? verificationLocation.address : instrument.installationAddress?.addressLine),
    verificationLocation: verificationLocation || {
      locationType: 'ON_SITE_PREMISES',
      address: instrument.installationAddress?.addressLine || 'Registered Business Premise',
      district: instrument.installationAddress?.district || 'Default District',
    },
    purpose: purpose || 'Mandatory statutory verification under Legal Metrology Act',
    remarks,
    createdBy: req.user._id,
    statusHistory: [
      {
        fromStatus: 'NONE',
        toStatus: APPLICATION_STATUSES.DRAFT,
        changedBy: req.user._id,
        remarks: 'Verification application drafted in system',
        timestamp: new Date(),
      },
    ],
  });

  await application.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.APPLICATION_CREATED,
    entity: 'VerificationApplication',
    entityId: application._id,
    metadata: {
      applicationNumber,
      instrumentId: instrument.instrumentId,
      stakeholder: stakeholder.businessName,
    },
  });

  const populated = await VerificationApplication.findById(application._id)
    .populate('stakeholder', 'businessName tradeLicenseNumber registeredAddress')
    .populate('instrument', 'instrumentId category instrumentType serialNumber manufacturer capacity');

  return ApiResponse.created(res, populated, 'Verification application drafted successfully');
});

export const updateApplication = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  // Authorization and draft-lock check
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to modify this application.');
    }

    if (application.currentStatus !== APPLICATION_STATUSES.DRAFT) {
      throw ApiError.forbidden(
        `Submitted or active applications cannot be modified by the applicant. Current status: ${application.currentStatus}`
      );
    }
  }

  // Reject tampering with protected status / review / privilege fields
  const forbiddenFields = [
    'applicationStatus',
    'currentStatus',
    'status',
    'reviewedBy',
    'reviewedAt',
    'approvedBy',
    'rejectionReason',
    'submittedAt',
    'applicationNumber',
    'role',
    'permissions',
    'isAdmin',
    'isSuperAdmin',
    'verificationStatus',
    'certificateStatus',
    'ownership',
    'stakeholder',
    'stakeholderId',
    'officerId',
    'jurisdiction',
  ];
  for (const field of forbiddenFields) {
    if (req.body[field] !== undefined) {
      throw ApiError.forbidden(`Direct modification of official field '${field}' is strictly prohibited.`);
    }
  }

  const allowedFields = [
    'applicationType',
    'verificationType',
    'purpose',
    'remarks',
    'preferredVerificationCenter',
    'preferredLocation',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      application[field] = req.body[field];
    }
  });

  if (req.body.requestedDate || req.body.preferredVerificationDate) {
    const targetDate = new Date(req.body.requestedDate || req.body.preferredVerificationDate);
    application.requestedDate = targetDate;
    application.preferredVerificationDate = targetDate;
  }

  if (req.body.verificationLocation) {
    application.verificationLocation = {
      ...(application.verificationLocation?.toObject?.() || application.verificationLocation || {}),
      ...req.body.verificationLocation,
    };
  }

  application.updatedBy = req.user._id;
  await application.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.APPLICATION_UPDATED,
    entity: 'VerificationApplication',
    entityId: application._id,
    metadata: { applicationNumber: application.applicationNumber },
  });

  const updated = await VerificationApplication.findById(application._id)
    .populate('stakeholder', 'businessName tradeLicenseNumber')
    .populate('instrument', 'instrumentId category instrumentType serialNumber manufacturer');

  return ApiResponse.success(res, updated, 'Draft application updated successfully');
});

export const submitApplication = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  // Ownership check
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You can only submit your own draft applications.');
    }
  }

  if (application.currentStatus !== APPLICATION_STATUSES.DRAFT) {
    throw ApiError.badRequest(
      `Only DRAFT applications can be submitted. Current status: ${application.currentStatus}`
    );
  }

  // Validate instrument is active and not out of service
  const instrument = await Instrument.findById(application.instrument);
  if (!instrument || !instrument.isActive || instrument.status === INSTRUMENT_STATUSES.OUT_OF_SERVICE) {
    throw ApiError.badRequest('Target instrument is inactive or out-of-service for verification submission.');
  }

  // Transition using central engine
  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.SUBMITTED,
    req.user,
    { remarks: 'Application formally submitted for departmental verification review' }
  );

  const populated = await VerificationApplication.findById(updatedApp._id)
    .populate('stakeholder', 'businessName tradeLicenseNumber')
    .populate('instrument', 'instrumentId category serialNumber');

  return ApiResponse.success(res, populated, 'Application submitted successfully for verification');
});

export const reviewApplication = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  // Role validation
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users cannot review verification applications.');
  }
  if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    throw ApiError.forbidden('Field officers cannot perform formal application scrutiny.');
  }

  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  // Transition using central engine
  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.UNDER_REVIEW,
    req.user,
    { remarks: req.body.remarks || 'Application placed under technical scrutiny' }
  );

  return ApiResponse.success(res, updatedApp, 'Application placed under review');
});

export const approveApplication = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  // Role check: Only Admins and Legal Metrology Officers
  if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN &&
    req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    throw ApiError.forbidden('You are not authorized to approve verification applications.');
  }

  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.APPROVED,
    req.user,
    { remarks: req.body.remarks || 'Application verified and approved for inspection scheduling' }
  );

  return ApiResponse.success(res, updatedApp, 'Application approved successfully');
});

export const rejectApplication = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  // Role check: Only Admins and Legal Metrology Officers
  if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN &&
    req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    throw ApiError.forbidden('You are not authorized to reject verification applications.');
  }

  const { rejectionReason } = req.body;
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw ApiError.badRequest('Specific statutory rejection reason is mandatory.');
  }

  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  const updatedApp = await transitionApplicationStatus(
    application,
    APPLICATION_STATUSES.REJECTED,
    req.user,
    { rejectionReason }
  );

  return ApiResponse.success(res, updatedApp, 'Application rejected with statutory reason recorded');
});

export const getApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};

  // Strict tenant data isolation
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, buildPaginationResponse([], 0, page, limit));
    }
    filter.stakeholder = stakeholder._id;
  } else if (
    req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER ||
    req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER
  ) {
    if (req.query.assignedToMe === 'true') {
      filter.assignedLMO = req.user._id;
    }
  }

  // Status filtering (accepts applicationStatus or status)
  const statusFilter = req.query.applicationStatus || req.query.status;
  if (statusFilter) {
    if (statusFilter === 'PENDING') {
      filter.currentStatus = {
        $in: [
          APPLICATION_STATUSES.SUBMITTED,
          APPLICATION_STATUSES.UNDER_REVIEW,
          APPLICATION_STATUSES.SCHEDULED,
          APPLICATION_STATUSES.INSPECTION,
        ],
      };
    } else {
      filter.currentStatus = statusFilter;
    }
  }
  if (req.query.applicationType) {
    filter.applicationType = req.query.applicationType;
  }
  if (req.query.verificationType) {
    filter.verificationType = req.query.verificationType;
  }
  if (req.query.stakeholderId) {
    if (mongoose.Types.ObjectId.isValid(req.query.stakeholderId)) {
      filter.stakeholder = req.query.stakeholderId;
    }
  }
  if (req.query.instrumentId) {
    if (mongoose.Types.ObjectId.isValid(req.query.instrumentId)) {
      filter.instrument = req.query.instrumentId;
    }
  }
  if (req.query.district) {
    filter['verificationLocation.district'] = new RegExp(escapeRegex(req.query.district), 'i');
  }
  if (req.query.startDate && req.query.endDate) {
    filter.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { applicationNumber: { $regex: safeSearch, $options: 'i' } },
      { purpose: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [applications, total] = await Promise.all([
    VerificationApplication.find(filter)
      .populate('stakeholder', 'businessName tradeLicenseNumber registeredAddress')
      .populate('instrument', 'instrumentId category instrumentType serialNumber manufacturer capacity accuracyClass')
      .populate('assignedLMO', 'name email phone designation')
      .populate('reviewedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    VerificationApplication.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    buildPaginationResponse(applications, total, page, limit),
    'Applications retrieved successfully'
  );
});

export const getApplicationById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  const application = await VerificationApplication.findById(req.params.id)
    .populate('stakeholder')
    .populate('instrument')
    .populate('assignedLMO', 'name email phone designation jurisdiction')
    .populate('reviewedBy', 'name email role');

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  // Authorization check for business user
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder._id || application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to view this application.');
    }
  }

  // Fetch associated schedule, inspection, result, and certificate
  const [schedule, inspection, result, certificate] = await Promise.all([
    VerificationSchedule.findOne({ application: application._id }).populate('assignedOfficer', 'name email phone designation'),
    VerificationInspection.findOne({ application: application._id }),
    VerificationResult.findOne({ application: application._id }),
    Certificate.findOne({ application: application._id }),
  ]);

  return ApiResponse.success(
    res,
    {
      application,
      schedule,
      inspection,
      result,
      certificate,
    },
    'Application dossier retrieved successfully'
  );
});

export const getApplicationHistory = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  // Authorization check for business user
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to view the history of this application.');
    }
  }

  // Fetch immutable audit log entries
  const auditLogs = await AuditLog.find({
    entity: 'VerificationApplication',
    entityId: application._id,
  })
    .sort({ timestamp: -1 })
    .populate('user', 'name email role');

  return ApiResponse.success(
    res,
    {
      applicationNumber: application.applicationNumber,
      currentStatus: application.currentStatus,
      statusHistory: application.statusHistory,
      auditEvents: auditLogs,
    },
    'Application history retrieved successfully'
  );
});

export const uploadApplicationDocument = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest('Invalid application ID format');
  }

  if (!req.file) {
    throw ApiError.badRequest('No document uploaded');
  }

  const application = await VerificationApplication.findById(req.params.id);
  if (!application) {
    cleanupFile(req.file.path);
    throw ApiError.notFound('Application not found');
  }

  // Authorization check for business user and allowed officer roles
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(application.stakeholder) !== String(stakeholder._id)) {
      cleanupFile(req.file.path);
      throw ApiError.forbidden('You can only upload documents to your own verification applications.');
    }
  } else if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN &&
    req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden('You are not authorized to upload documents to this application.');
  }

  // Validate uploaded file magic bytes & security
  await validateUploadedFile(req.file);

  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const doc = {
    title: sanitizeFileName(req.body.title || req.file.originalname),
    docType: req.body.docType || 'SUPPORTING_DOCUMENT',
    fileName: safeOriginalName,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    uploadedAt: new Date(),
  };

  application.documents.push(doc);
  application.updatedBy = req.user._id;
  await application.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: 'VerificationApplication',
    entityId: application._id,
    metadata: {
      title: doc.title,
      docType: doc.docType,
      fileName: doc.fileName,
    },
  });

  return ApiResponse.created(res, application, 'Document attached to application successfully');
});
