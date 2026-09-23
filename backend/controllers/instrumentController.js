import mongoose from 'mongoose';
import { Instrument } from '../models/Instrument.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Certificate } from '../models/Certificate.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import { USER_ROLES, INSTRUMENT_STATUSES, AUDIT_ACTIONS } from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';
import { escapeRegex } from '../utils/securityUtils.js';
import { cleanupFile, validateUploadedFile, sanitizeFileName } from '../utils/fileSecurity.js';

export const getInstruments = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};

  // Strict data isolation: Business users can only view their own instruments
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(
        res,
        buildPaginationResponse([], 0, page, limit),
        'No instruments found'
      );
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.query.stakeholderId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.stakeholderId)) {
      throw ApiError.badRequest('Invalid stakeholderId parameter format');
    }
    filter.stakeholder = req.query.stakeholderId;
  }

  if (req.query.status) {
    if (req.query.status === 'EXPIRED') {
      const now = new Date();
      filter.$or = [
        { status: INSTRUMENT_STATUSES.EXPIRED },
        { nextVerificationDueDate: { $lt: now } },
      ];
    } else if (req.query.status === 'EXPIRING_SOON') {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filter.$or = [
        { status: INSTRUMENT_STATUSES.EXPIRED },
        { nextVerificationDueDate: { $lte: in30Days } },
      ];
    } else {
      filter.status = req.query.status;
    }
  }
  if (req.query.category && req.query.category !== 'undefined') {
    let cat = req.query.category;
    if (cat === 'NON_AUTOMATIC_WEIGHING_INSTRUMENTS') {
      cat = 'NON_AUTOMATIC_WEIGHING_INSTRUMENT';
    }
    filter.category = cat;
  }
  if (req.query.accuracyClass) {
    filter.accuracyClass = req.query.accuracyClass;
  }
  if (req.query.manufacturer) {
    filter.manufacturer = new RegExp(escapeRegex(req.query.manufacturer), 'i');
  }
  if (req.query.instrumentType) {
    filter.instrumentType = new RegExp(escapeRegex(req.query.instrumentType), 'i');
  }
  if (req.query.district) {
    filter['installationAddress.district'] = new RegExp(escapeRegex(req.query.district), 'i');
  }
  if (req.query.state) {
    filter['installationAddress.state'] = new RegExp(escapeRegex(req.query.state), 'i');
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { instrumentId: { $regex: safeSearch, $options: 'i' } },
      { serialNumber: { $regex: safeSearch, $options: 'i' } },
      { manufacturer: { $regex: safeSearch, $options: 'i' } },
      { modelNumber: { $regex: safeSearch, $options: 'i' } },
      { instrumentType: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [instruments, total] = await Promise.all([
    Instrument.find(filter)
      .populate('stakeholder', 'businessName tradeLicenseNumber registeredAddress')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Instrument.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    buildPaginationResponse(instruments, total, page, limit),
    'Instruments retrieved successfully'
  );
});

export const createInstrument = asyncHandler(async (req, res) => {
  let stakeholderId = null;

  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      throw ApiError.badRequest('Please complete your stakeholder business profile before registering instruments.');
    }
    // Business users can only register instruments under their own stakeholder profile
    stakeholderId = stakeholder._id;
  } else {
    // Super Admin, Admin, and Officers can register on behalf of a stakeholder
    stakeholderId = req.body.stakeholderId || req.body.stakeholder;
    if (!stakeholderId || !mongoose.Types.ObjectId.isValid(stakeholderId)) {
      throw ApiError.badRequest('Valid stakeholder association (stakeholderId) is required.');
    }
    const stakeholderExists = await Stakeholder.findById(stakeholderId);
    if (!stakeholderExists) {
      throw ApiError.notFound('Associated stakeholder business profile not found');
    }
  }

  // Check uniqueness of serial number per manufacturer
  const existingInstrument = await Instrument.findOne({
    manufacturer: new RegExp(`^${escapeRegex(req.body.manufacturer.trim())}$`, 'i'),
    serialNumber: req.body.serialNumber.trim(),
  });

  if (existingInstrument) {
    throw ApiError.conflict(
      `An instrument with serial number '${req.body.serialNumber}' from manufacturer '${req.body.manufacturer}' is already registered.`
    );
  }

  // Generate unique Instrument ID: INS-YYYY-XXXXXX
  const year = new Date().getFullYear();
  let instrumentId = req.body.instrumentId;
  if (instrumentId) {
    const existingWithId = await Instrument.findOne({ instrumentId });
    if (existingWithId) {
      throw ApiError.conflict(`An instrument with ID '${instrumentId}' is already registered.`);
    }
  } else {
    let isUnique = false;
    while (!isUnique) {
      const count = await Instrument.countDocuments();
      const randSuffix = Math.floor(100000 + Math.random() * 900000);
      instrumentId = `INS-${year}-${randSuffix}`;
      const found = await Instrument.findOne({ instrumentId });
      if (!found) isUnique = true;
    }
  }

  const verificationFrequencyMonths = req.body.verificationFrequencyMonths || 12;
  const nextVerificationDueDate = req.body.nextVerificationDueDate
    ? new Date(req.body.nextVerificationDueDate)
    : new Date(Date.now() + verificationFrequencyMonths * 30 * 24 * 60 * 60 * 1000);

  const instrument = new Instrument({
    ...req.body,
    instrumentId,
    stakeholder: stakeholderId,
    manufacturer: req.body.manufacturer.trim(),
    serialNumber: req.body.serialNumber.trim(),
    status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
    verificationFrequencyMonths,
    nextVerificationDueDate,
    createdBy: req.user._id,
    isActive: true,
  });

  await instrument.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.INSTRUMENT_REGISTERED,
    entity: 'Instrument',
    entityId: instrument._id,
    metadata: {
      instrumentId,
      serialNumber: instrument.serialNumber,
      manufacturer: instrument.manufacturer,
      stakeholder: stakeholderId,
    },
  });

  const populatedInstrument = await Instrument.findById(instrument._id).populate(
    'stakeholder',
    'businessName tradeLicenseNumber registeredAddress'
  );

  return ApiResponse.created(res, populatedInstrument, 'Instrument registered successfully');
});

export const getInstrumentById = asyncHandler(async (req, res) => {
  let instrument = null;

  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    instrument = await Instrument.findById(req.params.id)
      .populate('stakeholder', 'businessName tradeLicenseNumber registeredAddress contactPerson kycStatus gstin')
      .populate('createdBy', 'name email role');
  }

  if (!instrument) {
    instrument = await Instrument.findOne({ instrumentId: req.params.id })
      .populate('stakeholder', 'businessName tradeLicenseNumber registeredAddress contactPerson kycStatus gstin')
      .populate('createdBy', 'name email role');
  }

  if (!instrument) {
    throw ApiError.notFound('Instrument not found');
  }

  // Enforce data isolation: BUSINESS_USER can only view their own instrument
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder._id || instrument.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to view this instrument.');
    }
  }

  return ApiResponse.success(res, instrument, 'Instrument retrieved successfully');
});

/**
 * Calculates statutory Maximum Permissible Error (MPE) guideline tolerances
 * per Legal Metrology (General) Rules, 2011 (Seventh Schedule)
 */
export function calculateMpeGuidelines(accuracyClass, capacity) {
  const capVal = typeof capacity === 'object' ? capacity?.value : capacity;
  const unit = (typeof capacity === 'object' ? capacity?.unit : 'kg') || 'kg';
  const standard = 'Legal Metrology (General) Rules, 2011 & Seventh Schedule (NAWI)';
  let tiers = [];
  const note = 'Verification Maximum Permissible Errors (MPE) apply during initial verification and subsequent re-verification.';

  const accUpper = String(accuracyClass || '').toUpperCase();

  if (accUpper.includes('CLASS_I_SPECIAL') || accUpper === 'CLASS_I' || accUpper.includes('SPECIAL')) {
    tiers = [
      { range: '0 ≤ m ≤ 50,000 e', tolerance: '± 0.5 e', description: 'Fine sensitivity initial verification range' },
      { range: '50,000 e < m ≤ 200,000 e', tolerance: '± 1.0 e', description: 'Mid-load verification tolerance' },
      { range: 'm > 200,000 e', tolerance: '± 1.5 e', description: 'Upper capacity verification limit' },
    ];
  } else if (accUpper.includes('CLASS_II_HIGH') || accUpper === 'CLASS_II' || accUpper.includes('HIGH')) {
    tiers = [
      { range: '0 ≤ m ≤ 5,000 e', tolerance: '± 0.5 e', description: 'Low load tolerance band' },
      { range: '5,000 e < m ≤ 20,000 e', tolerance: '± 1.0 e', description: 'Mid load standard tolerance' },
      { range: 'm > 20,000 e', tolerance: '± 1.5 e', description: 'High load verification threshold' },
    ];
  } else if (accUpper.includes('CLASS_IIII_ORDINARY') || accUpper === 'CLASS_IIII' || accUpper.includes('ORDINARY')) {
    tiers = [
      { range: '0 ≤ m ≤ 50 e', tolerance: '± 0.5 e', description: 'Initial commercial tolerance' },
      { range: '50 e < m ≤ 200 e', tolerance: '± 1.0 e', description: 'Working range verification' },
      { range: '200 e < m ≤ 1,000 e', tolerance: '± 1.5 e', description: 'Full capacity threshold' },
    ];
  } else {
    // Default to Class III (Medium Accuracy) - most common commercial scales
    tiers = [
      { range: '0 ≤ m ≤ 500 e', tolerance: '± 0.5 e', description: 'Initial commercial tolerance' },
      { range: '500 e < m ≤ 2,000 e', tolerance: '± 1.0 e', description: 'General trading & retail tolerance' },
      { range: '2,000 e < m ≤ 10,000 e', tolerance: '± 1.5 e', description: 'Bulk & high-capacity range' },
    ];
  }

  return {
    standard,
    accuracyClass: accuracyClass || 'Class III (Medium Accuracy)',
    capacitySpec: capVal ? `${capVal} ${unit}` : 'Standard Commercial',
    note,
    tiers,
  };
}

/**
 * Instant QR / Barcode / Token lookup for field officers
 * GET /api/instruments/scan/lookup?q=...
 */
export const lookupInstrumentByScan = asyncHandler(async (req, res) => {
  const rawQuery = (req.query.q || req.query.code || req.query.token || req.params.code || '').trim();

  if (!rawQuery) {
    throw ApiError.badRequest('Please provide a QR code, barcode, serial number, or instrument token to scan/lookup.');
  }

  // 1. Clean & Parse Query Token
  let cleanQuery = rawQuery;

  // Handle URL format: e.g. http://localhost:3000/api/public/certificates/verify/<token>
  if (cleanQuery.startsWith('http://') || cleanQuery.startsWith('https://') || cleanQuery.includes('/verify/')) {
    try {
      const parsedUrl = new URL(cleanQuery, 'https://emaap.gov.in');
      const paramToken =
        parsedUrl.searchParams.get('token') ||
        parsedUrl.searchParams.get('certificateNo') ||
        parsedUrl.searchParams.get('instrumentId') ||
        parsedUrl.searchParams.get('q');
      if (paramToken) {
        cleanQuery = paramToken.trim();
      } else {
        const segments = parsedUrl.pathname.split('/').filter(Boolean);
        const vIndex = segments.indexOf('verify');
        if (vIndex !== -1 && segments[vIndex + 1]) {
          cleanQuery = segments[vIndex + 1].trim();
        } else if (segments.length > 0) {
          cleanQuery = segments[segments.length - 1].trim();
        }
      }
    } catch {
      // Ignore URL parse error
    }
  }

  // Handle JSON format: e.g. {"instrumentId": "INS-2026-..."}
  if (cleanQuery.startsWith('{') && cleanQuery.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(cleanQuery);
      cleanQuery =
        parsedJson.instrumentId ||
        parsedJson.serialNumber ||
        parsedJson.certificateNumber ||
        parsedJson.token ||
        cleanQuery;
    } catch {
      // Ignore JSON parse error
    }
  }

  cleanQuery = cleanQuery.trim();

  let instrument = null;
  let matchedBy = null;
  let certificate = null;

  // Attempt 1: Match by official instrumentId (e.g. INS-2026-XXXXXX)
  instrument = await Instrument.findOne({
    instrumentId: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i'),
  })
    .populate('stakeholder')
    .populate('createdBy', 'name email role');

  if (instrument) {
    matchedBy = 'INSTRUMENT_ID';
  }

  // Attempt 2: Match by MongoDB ObjectId
  if (!instrument && mongoose.Types.ObjectId.isValid(cleanQuery)) {
    instrument = await Instrument.findById(cleanQuery)
      .populate('stakeholder')
      .populate('createdBy', 'name email role');
    if (instrument) matchedBy = 'OBJECT_ID';
  }

  // Attempt 3: Match by Certificate (QR Token, Verification Token, Certificate Number)
  if (!instrument) {
    certificate = await Certificate.findOne({
      $or: [
        { qrToken: cleanQuery },
        { qrVerificationToken: cleanQuery },
        { qrCodeToken: cleanQuery },
        { certificateNumber: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i') },
      ],
    })
      .populate('instrument')
      .populate('stakeholder')
      .populate('issuedBy', 'name designation jurisdiction')
      .populate('issuedByOfficer', 'name designation jurisdiction');

    if (certificate && certificate.instrument) {
      instrument = await Instrument.findById(certificate.instrument._id || certificate.instrument)
        .populate('stakeholder')
        .populate('createdBy', 'name email role');
      if (instrument) matchedBy = 'CERTIFICATE_TOKEN';
    }
  }

  // Attempt 4: Match by Serial Number (exact or case-insensitive)
  if (!instrument) {
    instrument = await Instrument.findOne({
      serialNumber: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i'),
    })
      .populate('stakeholder')
      .populate('createdBy', 'name email role');
    if (instrument) matchedBy = 'SERIAL_NUMBER';
  }

  // Attempt 5: Match by Application Number
  if (!instrument) {
    const app = await VerificationApplication.findOne({
      applicationNumber: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i'),
    }).populate('instrument');
    if (app && app.instrument) {
      instrument = await Instrument.findById(app.instrument._id || app.instrument)
        .populate('stakeholder')
        .populate('createdBy', 'name email role');
      if (instrument) matchedBy = 'APPLICATION_NUMBER';
    }
  }

  // If still not found, return clean not-found response with actionable diagnostic help
  if (!instrument) {
    return ApiResponse.success(
      res,
      {
        found: false,
        query: rawQuery,
        cleanedQuery: cleanQuery,
        message: `No instrument or official certificate found matching '${cleanQuery}'.`,
        suggestedNextSteps: [
          'Verify the instrument serial number printed on the physical data plate.',
          'Check that the QR sticker is clear, clean, and not damaged.',
          'Confirm if the instrument has been registered in the Legal Metrology portal.',
          'If this is an unregistered device, you can register or create a verification notice from the dashboard.',
        ],
      },
      'Lookup complete - no instrument match found'
    );
  }

  // If certificate was not loaded in step 3, fetch the latest certificate for this instrument
  if (!certificate) {
    certificate = await Certificate.findOne({
      instrument: instrument._id,
    })
      .sort({ createdAt: -1 })
      .populate('issuedBy', 'name designation jurisdiction')
      .populate('issuedByOfficer', 'name designation jurisdiction');
  }

  // Fetch recent inspections for this instrument
  const recentInspections = await VerificationInspection.find({
    instrument: instrument._id,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('inspector', 'name designation')
    .lean();

  // Fetch any active/upcoming schedule
  const activeSchedule = await VerificationSchedule.findOne({
    $or: [
      { instrument: instrument._id },
      { 'application.instrument': instrument._id },
    ],
    status: { $in: ['SCHEDULED', 'IN_PROGRESS', 'CONFIRMED'] },
  })
    .sort({ scheduledDate: -1 })
    .populate('officer', 'name designation');

  // Compute MPE (Maximum Permissible Error) guideline table
  const mpeGuidelines = calculateMpeGuidelines(instrument.accuracyClass, instrument.capacity);

  // Dynamic due status
  const dueStatus = instrument.getDueStatus ? instrument.getDueStatus() : 'UP_TO_DATE';

  const result = {
    found: true,
    query: rawQuery,
    cleanedQuery: cleanQuery,
    matchedBy,
    dueStatus,
    instrument: {
      _id: instrument._id,
      id: instrument._id,
      instrumentId: instrument.instrumentId,
      category: instrument.category,
      instrumentType: instrument.instrumentType,
      manufacturer: instrument.manufacturer,
      modelNumber: instrument.modelNumber,
      serialNumber: instrument.serialNumber,
      capacity: instrument.capacity,
      accuracyClass: instrument.accuracyClass,
      verificationScaleInterval_e: instrument.verificationScaleInterval_e,
      minimumCapacity_Min: instrument.minimumCapacity_Min,
      dateOfManufacture: instrument.dateOfManufacture,
      installationAddress: instrument.installationAddress,
      status: instrument.status,
      verificationFrequencyMonths: instrument.verificationFrequencyMonths,
      lastVerificationDate: instrument.lastVerificationDate,
      nextVerificationDueDate: instrument.nextVerificationDueDate,
      remarks: instrument.remarks,
      photographs: instrument.photographs || [],
      documents: instrument.documents || [],
      createdAt: instrument.createdAt,
    },
    stakeholder: instrument.stakeholder
      ? {
          _id: instrument.stakeholder._id,
          businessName: instrument.stakeholder.businessName,
          tradeLicenseNumber: instrument.stakeholder.tradeLicenseNumber,
          registeredAddress: instrument.stakeholder.registeredAddress,
          contactPerson: instrument.stakeholder.contactPerson,
          gstin: instrument.stakeholder.gstin,
        }
      : null,
    activeCertificate: certificate
      ? {
          _id: certificate._id,
          id: certificate._id,
          certificateNumber: certificate.certificateNumber,
          status: certificate.certificateStatus || certificate.status,
          validFrom: certificate.validFrom,
          validUntil: certificate.validUntil,
          verificationDate: certificate.verificationDate || certificate.issuedAt,
          tamperEvidentHash: certificate.tamperEvidentHash,
          pdfUrl: certificate.certificateUrl || certificate.pdfUrl,
          qrToken: certificate.qrToken || certificate.qrVerificationToken,
          qrUrl: certificate.qrUrl,
          issuedByOfficer:
            certificate.issuedBy?.name ||
            certificate.issuedByOfficer?.name ||
            'Inspector of Legal Metrology',
        }
      : null,
    recentInspections: (recentInspections || []).map((ins) => ({
      _id: ins._id,
      inspectionNumber: ins.inspectionNumber,
      status: ins.inspectionStatus || ins.status,
      result: ins.result,
      inspectionDate: ins.inspectionDate || ins.createdAt,
      inspector: ins.inspector?.name || 'Enforcement Officer',
      remarks: ins.remarks,
    })),
    activeSchedule: activeSchedule
      ? {
          _id: activeSchedule._id,
          scheduleNumber: activeSchedule.scheduleNumber,
          scheduledDate: activeSchedule.scheduledDate,
          timeSlot: activeSchedule.timeSlot,
          status: activeSchedule.status,
        }
      : null,
    mpeGuidelines,
  };

  return ApiResponse.success(res, result, 'Instrument details retrieved successfully');
});

export const updateInstrument = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid instrument ID format');
  }

  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    throw ApiError.notFound('Instrument not found');
  }

  // Authorization checks
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You can only update your own registered instruments.');
    }

    // Reject tampering with protected verification fields or privilege escalation
    const protectedFields = [
      'status',
      'lastVerificationDate',
      'nextVerificationDueDate',
      'instrumentId',
      'stakeholder',
      'stakeholderId',
      'verificationResult',
      'certificateInformation',
      'role',
      'permissions',
      'isAdmin',
      'isSuperAdmin',
      'verificationStatus',
      'certificateStatus',
      'ownership',
      'officerId',
      'jurisdiction',
    ];
    for (const field of protectedFields) {
      if (req.body[field] !== undefined) {
        throw ApiError.forbidden(`Modifying official verification field '${field}' by business users is strictly prohibited.`);
      }
    }
  } else if (
    req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
    req.user.role === USER_ROLES.GATC_OFFICER
  ) {
    throw ApiError.forbidden('Field and testing officers cannot modify general instrument registration directly.');
  }

  // If manufacturer or serial number is being updated, verify uniqueness
  const newManufacturer = req.body.manufacturer ? req.body.manufacturer.trim() : instrument.manufacturer;
  const newSerialNumber = req.body.serialNumber ? req.body.serialNumber.trim() : instrument.serialNumber;

  if (newManufacturer !== instrument.manufacturer || newSerialNumber !== instrument.serialNumber) {
    const existing = await Instrument.findOne({
      manufacturer: new RegExp(`^${escapeRegex(newManufacturer)}$`, 'i'),
      serialNumber: newSerialNumber,
      _id: { $ne: instrument._id },
    });
    if (existing) {
      throw ApiError.conflict(
        `An instrument with serial number '${newSerialNumber}' from manufacturer '${newManufacturer}' is already registered.`
      );
    }
    instrument.manufacturer = newManufacturer;
    instrument.serialNumber = newSerialNumber;
  }

  const allowedFields = [
    'instrumentType',
    'category',
    'modelNumber',
    'capacity',
    'accuracyClass',
    'verificationScaleInterval_e',
    'minimumCapacity_Min',
    'dateOfManufacture',
    'verificationFrequencyMonths',
    'remarks',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      instrument[field] = req.body[field];
    }
  });

  if (req.body.installationAddress) {
    instrument.installationAddress = {
      ...(instrument.installationAddress?.toObject?.() || instrument.installationAddress || {}),
      ...req.body.installationAddress,
    };
  }

  // Admins can update status or verification dates if required
  if (req.user.role === USER_ROLES.SUPER_ADMIN || req.user.role === USER_ROLES.ADMIN) {
    if (req.body.status) instrument.status = req.body.status;
    if (req.body.lastVerificationDate) instrument.lastVerificationDate = req.body.lastVerificationDate;
    if (req.body.nextVerificationDueDate) instrument.nextVerificationDueDate = req.body.nextVerificationDueDate;
    if (req.body.isActive !== undefined) instrument.isActive = req.body.isActive;
  }

  instrument.updatedBy = req.user._id;
  await instrument.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.INSTRUMENT_UPDATED,
    entity: 'Instrument',
    entityId: instrument._id,
    metadata: {
      instrumentId: instrument.instrumentId,
      serialNumber: instrument.serialNumber,
    },
  });

  const updated = await Instrument.findById(instrument._id).populate(
    'stakeholder',
    'businessName tradeLicenseNumber registeredAddress'
  );

  return ApiResponse.success(res, updated, 'Instrument updated successfully');
});

export const deleteInstrument = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid instrument ID format');
  }

  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    throw ApiError.notFound('Instrument not found');
  }

  // Authorization check
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to delete or deactivate this instrument.');
    }
  } else if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN
  ) {
    throw ApiError.forbidden('You are not authorized to delete or deactivate instruments.');
  }

  // Check statutory history: applications or certificates
  const [appCount, certCount] = await Promise.all([
    VerificationApplication.countDocuments({ instrument: instrument._id }),
    Certificate.countDocuments({ instrument: instrument._id }),
  ]);

  if (appCount > 0 || certCount > 0) {
    // Preserve statutory audit trail: Soft deactivate and mark OUT_OF_SERVICE
    instrument.isActive = false;
    instrument.status = INSTRUMENT_STATUSES.OUT_OF_SERVICE;
    instrument.updatedBy = req.user._id;
    await instrument.save();

    await logAuditEvent({
      user: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email,
      action: AUDIT_ACTIONS.INSTRUMENT_UPDATED,
      entity: 'Instrument',
      entityId: instrument._id,
      metadata: {
        action: 'DEACTIVATED_HISTORICAL_PRESERVED',
        appCount,
        certCount,
        instrumentId: instrument.instrumentId,
      },
    });

    return ApiResponse.success(
      res,
      {
        deactivated: true,
        instrumentId: instrument.instrumentId,
        status: instrument.status,
        isActive: instrument.isActive,
      },
      'Instrument has existing statutory verification records. It has been safely deactivated and marked OUT_OF_SERVICE to preserve audit history.'
    );
  }

  // No statutory history exists: Safe removal
  await Instrument.findByIdAndDelete(instrument._id);

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: 'INSTRUMENT_DELETED',
    entity: 'Instrument',
    entityId: instrument._id,
    metadata: { instrumentId: instrument.instrumentId },
  });

  return ApiResponse.success(
    res,
    { deleted: true, id: instrument._id, instrumentId: instrument.instrumentId },
    'Instrument deleted successfully'
  );
});

export const uploadInstrumentPhoto = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest('Invalid instrument ID format');
  }

  if (!req.file) {
    throw ApiError.badRequest('No photograph was uploaded.');
  }

  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    cleanupFile(req.file.path);
    throw ApiError.notFound('Instrument not found');
  }

  // Authorization check
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      cleanupFile(req.file.path);
      throw ApiError.forbidden('You can only upload photographs for your own instruments.');
    }
  } else if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN
  ) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden('You are not authorized to upload photographs for instruments.');
  }

  // Validate uploaded file magic bytes & security
  await validateUploadedFile(req.file);

  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const photoRecord = {
    caption: sanitizeFileName(req.body.caption || 'Instrument On-Site Photograph'),
    fileName: safeOriginalName,
    fileUrl: `/uploads/instrument-photos/${req.file.filename}`,
    uploadedAt: new Date(),
  };

  instrument.photographs.push(photoRecord);
  instrument.updatedBy = req.user._id;
  await instrument.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: 'Instrument',
    entityId: instrument._id,
    metadata: {
      type: 'PHOTO',
      fileName: photoRecord.fileName,
      fileUrl: photoRecord.fileUrl,
    },
  });

  return ApiResponse.created(res, instrument, 'Instrument photograph uploaded successfully');
});

export const uploadInstrumentDocument = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    if (req.file) cleanupFile(req.file.path);
    throw ApiError.badRequest('Invalid instrument ID format');
  }

  if (!req.file) {
    throw ApiError.badRequest('No document was uploaded.');
  }

  const instrument = await Instrument.findById(req.params.id);
  if (!instrument) {
    cleanupFile(req.file.path);
    throw ApiError.notFound('Instrument not found');
  }

  // Authorization check
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(instrument.stakeholder) !== String(stakeholder._id)) {
      cleanupFile(req.file.path);
      throw ApiError.forbidden('You can only upload documents for your own instruments.');
    }
  } else if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN &&
    req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    cleanupFile(req.file.path);
    throw ApiError.forbidden('You are not authorized to upload documents for instruments.');
  }

  // Validate uploaded file magic bytes & security
  await validateUploadedFile(req.file);

  const allowedDocTypes = [
    'OWNERSHIP_PROOF',
    'PREVIOUS_VERIFICATION_CERTIFICATE',
    'INVOICE',
    'MANUFACTURER_TEST_CERTIFICATE',
    'SUPPORTING_DOCUMENT',
  ];

  const docType = allowedDocTypes.includes(req.body.docType)
    ? req.body.docType
    : 'SUPPORTING_DOCUMENT';

  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const docRecord = {
    title: sanitizeFileName(req.body.title || 'Supporting Instrument Document'),
    docType,
    fileName: safeOriginalName,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    uploadedAt: new Date(),
  };

  instrument.documents.push(docRecord);
  instrument.updatedBy = req.user._id;
  await instrument.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: 'Instrument',
    entityId: instrument._id,
    metadata: {
      docType: docRecord.docType,
      fileName: docRecord.fileName,
      fileUrl: docRecord.fileUrl,
    },
  });

  return ApiResponse.created(res, instrument, 'Instrument document uploaded successfully');
});

export const getExpiringInstrumentsSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const baseFilter = { isActive: true };
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (stakeholder) {
      baseFilter.stakeholder = stakeholder._id;
    } else {
      return ApiResponse.success(res, {
        expired: 0,
        expiringWithin7Days: 0,
        expiringWithin15Days: 0,
        expiringWithin30Days: 0,
      });
    }
  }

  const [expiredCount, expiring7Count, expiring15Count, expiring30Count] = await Promise.all([
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $lt: now } }),
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $gte: now, $lte: in7Days } }),
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $gte: now, $lte: in15Days } }),
    Instrument.countDocuments({ ...baseFilter, nextVerificationDueDate: { $gte: now, $lte: in30Days } }),
  ]);

  return ApiResponse.success(
    res,
    {
      expired: expiredCount,
      expiringWithin7Days: expiring7Count,
      expiringWithin15Days: expiring15Count,
      expiringWithin30Days: expiring30Count,
    },
    'Expiry summary calculated dynamically from database'
  );
});
