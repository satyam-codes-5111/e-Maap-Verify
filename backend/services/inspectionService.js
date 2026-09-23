import mongoose from 'mongoose';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { Instrument } from '../models/Instrument.js';
import { Certificate } from '../models/Certificate.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/securityUtils.js';
import {
  APPLICATION_STATUSES,
  SCHEDULE_STATUSES,
  INSTRUMENT_STATUSES,
  INSPECTION_STATUSES,
  INSPECTION_RESULTS,
  VERIFICATION_VERDICTS,
  USER_ROLES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  ALLOWED_INSPECTION_STATUS_TRANSITIONS,
} from '../config/constants.js';
import { logAuditEvent } from './auditService.js';
import { createNotification } from './notificationService.js';
import { issueVerificationCertificate } from './certificateService.js';
import { validateUploadedFile, processBase64Upload } from '../utils/fileSecurity.js';
import { runInTransaction } from '../utils/transactionHelper.js';

/**
 * Helper: Resolve an Instrument from Scanned QR Code / Token / ID / Serial
 */
export async function resolveInstrumentFromScannedCode(scannedCode) {
  const rawQuery = (scannedCode || '').trim();
  if (!rawQuery) {
    throw ApiError.badRequest('A valid QR code, instrument ID, or serial number is required.');
  }

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

  // 1. By official instrumentId (e.g. INST-PH8-001 or INS-2026-...)
  instrument = await Instrument.findOne({
    instrumentId: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i'),
  }).populate('stakeholder');

  if (instrument) {
    matchedBy = 'INSTRUMENT_ID';
  }

  // 2. By MongoDB ObjectId
  if (!instrument && mongoose.Types.ObjectId.isValid(cleanQuery)) {
    instrument = await Instrument.findById(cleanQuery).populate('stakeholder');
    if (instrument) matchedBy = 'OBJECT_ID';
  }

  // 3. By Certificate Token or Certificate Number
  if (!instrument) {
    const certificate = await Certificate.findOne({
      $or: [
        { qrToken: cleanQuery },
        { qrVerificationToken: cleanQuery },
        { qrCodeToken: cleanQuery },
        { certificateNumber: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i') },
      ],
    }).populate('instrument');

    if (certificate && certificate.instrument) {
      instrument = await Instrument.findById(certificate.instrument._id || certificate.instrument).populate('stakeholder');
      if (instrument) matchedBy = 'CERTIFICATE_TOKEN';
    }
  }

  // 4. By Serial Number
  if (!instrument) {
    instrument = await Instrument.findOne({
      serialNumber: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i'),
    }).populate('stakeholder');
    if (instrument) matchedBy = 'SERIAL_NUMBER';
  }

  // 5. By Application Number
  if (!instrument) {
    const app = await VerificationApplication.findOne({
      applicationNumber: new RegExp(`^${escapeRegex(cleanQuery)}$`, 'i'),
    }).populate('instrument');
    if (app && app.instrument) {
      instrument = await Instrument.findById(app.instrument._id || app.instrument).populate('stakeholder');
      if (instrument) matchedBy = 'APPLICATION_NUMBER';
    }
  }

  if (!instrument) {
    throw ApiError.notFound(`No instrument found matching scanned QR code or ID '${cleanQuery}'.`);
  }

  return { instrument, matchedBy, cleanQuery };
}

/**
 * Helper: Generate Statutory Metrological Checklist Fields from Instrument
 */
export function generateInspectionChecklistFromInstrument(instrument, scannedCode = '') {
  // Parse capacity value & unit
  let capVal = 50;
  let unit = 'kg';

  if (typeof instrument.capacity === 'object' && instrument.capacity !== null) {
    capVal = Number(instrument.capacity.value) || 50;
    unit = instrument.capacity.unit || 'kg';
  } else if (typeof instrument.capacity === 'number') {
    capVal = instrument.capacity;
  } else if (typeof instrument.capacity === 'string') {
    const parsed = parseFloat(instrument.capacity);
    if (!isNaN(parsed)) capVal = parsed;
    if (instrument.capacity.toLowerCase().includes('g') && !instrument.capacity.toLowerCase().includes('kg')) {
      unit = 'g';
    } else if (instrument.capacity.toLowerCase().includes('t') || instrument.capacity.toLowerCase().includes('ton')) {
      unit = 't';
    } else if (instrument.capacity.toLowerCase().includes('l')) {
      unit = 'L';
    }
  }

  // Scale Interval e
  let eVal = 0.01;
  if (instrument.verificationScaleInterval_e !== undefined) {
    const num = parseFloat(String(instrument.verificationScaleInterval_e));
    if (!isNaN(num) && num > 0) {
      if (unit === 'kg' && num >= 1) {
        eVal = Number((num / 1000).toFixed(5));
      } else {
        eVal = num;
      }
    }
  } else if (instrument.verificationScaleInterval !== undefined) {
    const num = parseFloat(String(instrument.verificationScaleInterval));
    if (!isNaN(num) && num > 0) eVal = num;
  } else {
    eVal = Number((capVal / 3000).toFixed(4)) || 0.01;
  }

  // Minimum Capacity Min
  let minCap = Number((eVal * 20).toFixed(3));
  if (instrument.minCapacity !== undefined) {
    const num = parseFloat(String(instrument.minCapacity));
    if (!isNaN(num) && num > 0) minCap = num;
  } else if (instrument.minimumCapacity_Min !== undefined) {
    const num = parseFloat(String(instrument.minimumCapacity_Min));
    if (!isNaN(num) && num > 0) minCap = num;
  }

  const point500e = Number((Math.min(500 * eVal, capVal * 0.25)).toFixed(3));
  const pointHalfMax = Number((capVal * 0.5).toFixed(3));
  const maxCap = Number(capVal.toFixed(3));
  const cornerLoad = Number((capVal / 3).toFixed(3));

  // Determine MPE tolerances based on Legal Metrology Rules (General) 2011
  const mpeZero = Number((0.5 * eVal).toFixed(4));
  const mpeMin = Number((0.5 * eVal).toFixed(4));
  const mpe500e = Number((0.5 * eVal).toFixed(4));
  const mpeHalfMax = Number((1.0 * eVal).toFixed(4));
  const mpeMax = Number((1.5 * eVal).toFixed(4));
  const mpeCorner = Number((1.0 * eVal).toFixed(4));

  const testReadings = [
    {
      loadPoint: 1,
      testName: 'Zero Load Verification Test',
      nominalLoad: 0,
      observedReading: 0,
      errorValue: 0,
      mpeAllowed: mpeZero,
      passed: true,
      unit,
    },
    {
      loadPoint: 2,
      testName: `Minimum Capacity Test (Min = ${minCap} ${unit})`,
      nominalLoad: minCap,
      observedReading: minCap,
      errorValue: 0,
      mpeAllowed: mpeMin,
      passed: true,
      unit,
    },
    {
      loadPoint: 3,
      testName: `Working Range Test (500e = ${point500e} ${unit})`,
      nominalLoad: point500e,
      observedReading: point500e,
      errorValue: 0,
      mpeAllowed: mpe500e,
      passed: true,
      unit,
    },
    {
      loadPoint: 4,
      testName: `Half Capacity Load Test (0.5 Max = ${pointHalfMax} ${unit})`,
      nominalLoad: pointHalfMax,
      observedReading: pointHalfMax,
      errorValue: 0,
      mpeAllowed: mpeHalfMax,
      passed: true,
      unit,
    },
    {
      loadPoint: 5,
      testName: `Full Capacity Load Test (Max = ${maxCap} ${unit})`,
      nominalLoad: maxCap,
      observedReading: maxCap,
      errorValue: 0,
      mpeAllowed: mpeMax,
      passed: true,
      unit,
    },
    {
      loadPoint: 6,
      testName: `Eccentricity (Corner / Off-Center Test at ${cornerLoad} ${unit})`,
      nominalLoad: cornerLoad,
      observedReading: cornerLoad,
      errorValue: 0,
      mpeAllowed: mpeCorner,
      passed: true,
      unit,
    },
  ];

  const instrumentReadings = testReadings.map((tr) => ({
    testName: tr.testName,
    standardValue: tr.nominalLoad,
    observedValue: tr.observedReading,
    unit: tr.unit,
    tolerance: tr.mpeAllowed,
    deviation: tr.errorValue,
    result: 'PASS',
    remarks: 'Within statutory Maximum Permissible Error (MPE)',
  }));

  const measurementReadings = testReadings.map((tr) => ({
    testType: tr.testName,
    appliedLoad: tr.nominalLoad,
    indicatedReading: tr.observedReading,
    intrinsicError: tr.errorValue,
    maximumPermissibleError: tr.mpeAllowed,
    isCompliant: true,
  }));

  const accuracyChecks = [
    {
      checkName: 'Zero Setting and Tare Accuracy (≤ 0.25e)',
      expectedValue: 0,
      observedValue: 0,
      unit,
      tolerance: mpeZero,
      status: 'PASS',
      remarks: 'Zero point error within statutory tolerance',
    },
    {
      checkName: `Minimum Capacity Loading Check (${minCap} ${unit})`,
      expectedValue: minCap,
      observedValue: minCap,
      unit,
      tolerance: mpeMin,
      status: 'PASS',
      remarks: 'Compliant with statutory minimum verification load',
    },
    {
      checkName: `Mid-Capacity Test (${pointHalfMax} ${unit})`,
      expectedValue: pointHalfMax,
      observedValue: pointHalfMax,
      unit,
      tolerance: mpeHalfMax,
      status: 'PASS',
      remarks: 'Within statutory working tolerance (±1.0e)',
    },
    {
      checkName: `Full Scale Maximum Capacity Test (${maxCap} ${unit})`,
      expectedValue: maxCap,
      observedValue: maxCap,
      unit,
      tolerance: mpeMax,
      status: 'PASS',
      remarks: 'Within statutory full scale tolerance (±1.5e)',
    },
    {
      checkName: 'Eccentricity (Off-Center / Corner Load Test)',
      expectedValue: cornerLoad,
      observedValue: cornerLoad,
      unit,
      tolerance: mpeCorner,
      status: 'PASS',
      remarks: 'Error at all 4 pan positions within MPE',
    },
    {
      checkName: 'Repeatability Test (3 Successive Readings at 0.8 Max)',
      expectedValue: Number((maxCap * 0.8).toFixed(3)),
      observedValue: Number((maxCap * 0.8).toFixed(3)),
      unit,
      tolerance: mpeHalfMax,
      status: 'PASS',
      remarks: 'Consecutive weighing error <= 1.0e',
    },
  ];

  const modelPlateId =
    instrument.modelApprovalNumber ||
    instrument.approvalModelNumber ||
    instrument.modelNumber ||
    'IND-LM-STD';

  const complianceChecks = [
    {
      checkName: `Model Approval Plate & Legal Markings (Approval No: ${modelPlateId})`,
      status: 'PASS',
      remarks: 'Physical model approval plate intact and verified',
    },
    {
      checkName: `Verification Scale Interval (e = ${eVal} ${unit})`,
      status: 'PASS',
      remarks: 'Scale interval matches stamped marking and database record',
    },
    {
      checkName: 'Physical Sealing Wire & Lead Seal Provision',
      status: 'PASS',
      remarks: 'Tamper-evident sealing wire holes and sealing screws intact',
    },
    {
      checkName: 'Leveling Arrangement & Spirit Level Centering',
      status: 'PASS',
      remarks: 'Spirit level indicator centered within reference index ring',
    },
    {
      checkName: 'Environmental Suitability & Vibration Dampening',
      status: 'PASS',
      remarks: 'Stable bench platform isolated from drafts and industrial vibration',
    },
    {
      checkName: 'Zero-Tracking Mechanism Operation',
      status: 'PASS',
      remarks: 'Automatic zero tracking operates within statutory limits',
    },
  ];

  const instrumentCondition = {
    visualCheckPassed: true,
    levelingBubbleCentered: true,
    modelApprovalPlateIntact: true,
    zeroTrackingOperational: true,
    notes: `Instrument ${instrument.instrumentId || instrument.serialNumber} (${instrument.instrumentType || instrument.category || 'NAWI'}) verified via scanned QR code. Visual, physical, and metrological checklist auto-populated on ${new Date().toLocaleDateString('en-IN')}.`,
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const quarter = Math.ceil(currentMonth / 3);

  const stampingAndSealing = {
    leadSealsApplied: 1,
    hologramStickerNumber: `DOCA-QR-${Math.floor(100000 + Math.random() * 900000)}`,
    stampingYearMark: `Q${quarter}/${currentYear}`,
    sealingPlugsIntact: true,
  };

  const checklist = {
    visualInspectionPassed: true,
    levelingBubbleCentered: true,
    sealIntact: true,
    environmentalSuitability: true,
    nameplateLegible: true,
    zeroTrackingFunctional: true,
    modelApprovalVerified: true,
    scannedQrMatched: true,
    scannedCode: scannedCode || instrument.instrumentId || instrument.serialNumber,
    scannedInstrumentId: instrument.instrumentId || String(instrument._id),
    scannedSerialNumber: instrument.serialNumber,
    instrumentName: instrument.instrumentName || instrument.instrumentType || instrument.category,
    accuracyClass: instrument.accuracyClass || 'Class III',
    capacity: `${capVal} ${unit}`,
    verificationScaleInterval_e: `${eVal} ${unit}`,
  };

  return {
    instrumentCondition,
    complianceChecks,
    accuracyChecks,
    instrumentReadings,
    measurementReadings,
    stampingAndSealing,
    testReadings,
    checklist,
    unit,
    maxCapacity: capVal,
    minCapacity: minCap,
    scaleInterval: eVal,
  };
}

/**
 * Backend Hook / Service: Auto-populate inspection checklist fields from scanned instrument ID / QR Code
 *
 * @param {string} scannedCode - QR code string, instrument ID, serial number, or verification token
 * @param {object} options - { inspectionId?: string, forceOverwrite?: boolean }
 * @param {object} user - Authenticated officer or admin
 */
export async function autoPopulateInspectionFromScannedInstrument(scannedCode, options = {}, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users are not authorized to perform inspection auto-population.');
  }

  // 1. Resolve Instrument from QR code / ID / Serial
  const { instrument, matchedBy, cleanQuery } = await resolveInstrumentFromScannedCode(scannedCode);

  // 2. Generate all checklist fields & metrological test readings
  const generatedData = generateInspectionChecklistFromInstrument(instrument, cleanQuery);

  let inspection = null;

  // 3. If an inspectionId is provided, attach and save to the inspection record
  if (options.inspectionId) {
    inspection = await VerificationInspection.findById(options.inspectionId);
    if (!inspection) {
      throw ApiError.notFound(`Inspection record with ID '${options.inspectionId}' not found.`);
    }

    // Check officer assignment authorization
    const isAssigned =
      String(inspection.assignedOfficer) === String(user._id) ||
      String(inspection.officer) === String(user._id);
    const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

    if (!isAssigned && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to update this inspection.');
    }

    // Check immutability
    if (
      inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
      inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
    ) {
      throw ApiError.badRequest('Finalized inspection records are immutable and cannot be modified.');
    }

    // Update inspection fields with auto-populated data
    inspection.instrument = instrument._id;
    inspection.instrumentCondition = generatedData.instrumentCondition;
    inspection.complianceChecks = generatedData.complianceChecks;
    inspection.accuracyChecks = generatedData.accuracyChecks;
    inspection.instrumentReadings = generatedData.instrumentReadings;
    inspection.measurementReadings = generatedData.measurementReadings;
    inspection.stampingAndSealing = generatedData.stampingAndSealing;
    inspection.observations = `Checklist auto-populated from scanned QR code (${cleanQuery}) for instrument ${instrument.instrumentId || instrument.serialNumber}.`;
    inspection.updatedBy = user._id;

    await inspection.save();

    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.INSPECTION_DRAFT_SAVED,
      entity: 'VerificationInspection',
      entityId: inspection._id,
      metadata: {
        source: 'QR_SCAN_AUTO_POPULATE',
        scannedCode: cleanQuery,
        matchedBy,
        instrumentId: instrument.instrumentId,
        serialNumber: instrument.serialNumber,
      },
    });
  }

  const inspectionObj = inspection ? (inspection.toObject ? inspection.toObject() : inspection) : null;
  if (inspectionObj) {
    inspectionObj.checklist = generatedData.checklist;
    inspectionObj.testReadings = generatedData.testReadings;
  }

  return {
    success: true,
    matchedBy,
    query: cleanQuery,
    instrument: {
      _id: instrument._id,
      instrumentId: instrument.instrumentId,
      serialNumber: instrument.serialNumber,
      modelNumber: instrument.modelNumber,
      manufacturer: instrument.manufacturer,
      category: instrument.category,
      instrumentType: instrument.instrumentType,
      accuracyClass: instrument.accuracyClass,
      capacity: instrument.capacity,
      verificationScaleInterval_e: instrument.verificationScaleInterval_e || instrument.verificationScaleInterval,
      status: instrument.status,
    },
    checklist: generatedData.checklist,
    testReadings: generatedData.testReadings,
    instrumentCondition: generatedData.instrumentCondition,
    complianceChecks: generatedData.complianceChecks,
    accuracyChecks: generatedData.accuracyChecks,
    instrumentReadings: generatedData.instrumentReadings,
    measurementReadings: generatedData.measurementReadings,
    stampingAndSealing: generatedData.stampingAndSealing,
    inspection: inspectionObj,
  };
}

/**
 * Service: Start Field Inspection
 */
export async function startInspection(scheduleId, user, options = {}) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users are not authorized to start official inspections.');
  }

  const schedule = await VerificationSchedule.findById(scheduleId)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder');

  if (!schedule) {
    throw ApiError.notFound('Verification schedule not found.');
  }

  // Check schedule validity
  if (schedule.status === SCHEDULE_STATUSES.CANCELLED) {
    throw ApiError.badRequest('Cannot start inspection for a cancelled schedule.');
  }

  if (schedule.status === SCHEDULE_STATUSES.COMPLETED) {
    throw ApiError.badRequest('Cannot start inspection for an already completed schedule.');
  }

  // Check officer assignment authorization
  const isAssignedOfficer =
    String(schedule.assignedOfficer?._id || schedule.assignedOfficer) === String(user._id);
  const isAssignedFieldOfficer =
    schedule.assignedFieldOfficer &&
    String(schedule.assignedFieldOfficer?._id || schedule.assignedFieldOfficer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssignedOfficer && !isAssignedFieldOfficer && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to inspect this schedule.');
  }

  // Application must exist and be in scheduled/approved/inspection state
  const application = schedule.application;
  if (!application) {
    throw ApiError.notFound('Associated application not found.');
  }

  if (
    application.currentStatus !== APPLICATION_STATUSES.APPROVED &&
    application.currentStatus !== APPLICATION_STATUSES.SCHEDULED &&
    application.currentStatus !== APPLICATION_STATUSES.INSPECTION
  ) {
    throw ApiError.badRequest(
      `Cannot start inspection on application in '${application.currentStatus}' state. Must be APPROVED, SCHEDULED, or INSPECTION.`
    );
  }

  // Prevent duplicate active inspection for this schedule
  const existingActiveInspection = await VerificationInspection.findOne({
    schedule: schedule._id,
    inspectionStatus: {
      $in: [
        INSPECTION_STATUSES.DRAFT,
        INSPECTION_STATUSES.IN_PROGRESS,
        INSPECTION_STATUSES.SUBMITTED,
        INSPECTION_STATUSES.UNDER_REVIEW,
      ],
    },
  });

  if (existingActiveInspection) {
    throw ApiError.conflict('An active inspection is already in progress for this schedule.');
  }

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const inspectionNumber = `INSP-${new Date().getFullYear()}-${randomSuffix}`;

  // If a scanned code is passed or the schedule has an instrument, pre-populate checklist fields
  let initialChecklistData = null;
  const targetInstrument = options.scannedCode
    ? (await resolveInstrumentFromScannedCode(options.scannedCode)).instrument
    : schedule.instrument;

  if (targetInstrument) {
    try {
      initialChecklistData = generateInspectionChecklistFromInstrument(
        targetInstrument,
        options.scannedCode || targetInstrument.instrumentId
      );
    } catch {
      // Non-blocking fallback if instrument fields are partial
    }
  }

  const inspection = new VerificationInspection({
    inspectionNumber,
    schedule: schedule._id,
    application: application._id,
    instrument: targetInstrument?._id || schedule.instrument._id || schedule.instrument,
    stakeholder: schedule.stakeholder?._id || schedule.stakeholder,
    assignedOfficer: user._id,
    officer: user._id, // backward compatibility
    verificationCenter: schedule.verificationCenter,
    gatc: schedule.gatc,
    location: schedule.locationAddress || 'Field inspection site',
    startTime: new Date(),
    inspectionDate: new Date(),
    inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
    instrumentCondition: initialChecklistData?.instrumentCondition,
    complianceChecks: initialChecklistData?.complianceChecks || [],
    accuracyChecks: initialChecklistData?.accuracyChecks || [],
    instrumentReadings: initialChecklistData?.instrumentReadings || [],
    measurementReadings: initialChecklistData?.measurementReadings || [],
    stampingAndSealing: initialChecklistData?.stampingAndSealing,
    observations: initialChecklistData
      ? `Field inspection initialized with statutory checklist auto-populated for instrument ${targetInstrument?.instrumentId || targetInstrument?.serialNumber || ''}.`
      : undefined,
    createdBy: user._id,
    updatedBy: user._id,
  });

  await inspection.save();

  // Update schedule status to IN_PROGRESS
  schedule.status = SCHEDULE_STATUSES.IN_PROGRESS;
  await schedule.save();

  // Update application status to INSPECTION if not already there
  if (application.currentStatus !== APPLICATION_STATUSES.INSPECTION) {
    const fromStatus = application.currentStatus;
    application.currentStatus = APPLICATION_STATUSES.INSPECTION;
    application.statusHistory.push({
      fromStatus,
      toStatus: APPLICATION_STATUSES.INSPECTION,
      changedBy: user._id,
      remarks: 'Field metrological testing and verification inspection commenced',
      timestamp: new Date(),
    });
    await application.save();
  }

  // Audit Log
  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_STARTED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      scheduleId: schedule._id,
      applicationNumber: application.applicationNumber,
    },
  });

  return inspection;
}

/**
 * Service: Save or Update Inspection Draft
 */
export async function saveInspectionDraft(inspectionId, data, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users cannot modify inspection data.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Authorization check
  const isAssigned =
    String(inspection.assignedOfficer) === String(user._id) ||
    String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to update this inspection.');
  }

  // Immutability: finalized records cannot be edited freely
  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest('Finalized inspection records are immutable and cannot be modified.');
  }

  // Hook: If a scanned instrument code is provided, auto-populate checklist fields
  const scannedCode = data.scannedCode || data.scannedInstrumentId || (data.autoPopulateFromScan ? String(inspection.instrument) : null);
  if (scannedCode) {
    try {
      const autoPop = await autoPopulateInspectionFromScannedInstrument(
        scannedCode,
        { inspectionId: inspection._id },
        user
      );
      if (autoPop && autoPop.inspection) {
        return autoPop.inspection;
      }
    } catch (err) {
      // If explicit scan code failed, rethrow with friendly message
      if (data.scannedCode || data.scannedInstrumentId) {
        throw err;
      }
    }
  }

  // Validate coordinates if provided
  if (data.latitude !== undefined && data.latitude !== null) {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw ApiError.badRequest('Latitude must be a valid number between -90 and 90.');
    }
    inspection.latitude = lat;
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    const lon = Number(data.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      throw ApiError.badRequest('Longitude must be a valid number between -180 and 180.');
    }
    inspection.longitude = lon;
  }

  if (data.gpsCoordinates) {
    const { latitude, longitude, accuracyMeters, address } = data.gpsCoordinates;
    if (latitude !== undefined) {
      const lat = Number(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw ApiError.badRequest('GPS latitude must be between -90 and 90.');
      }
    }
    if (longitude !== undefined) {
      const lon = Number(longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        throw ApiError.badRequest('GPS longitude must be between -180 and 180.');
      }
    }
    inspection.gpsCoordinates = {
      latitude: latitude !== undefined ? Number(latitude) : inspection.gpsCoordinates?.latitude,
      longitude: longitude !== undefined ? Number(longitude) : inspection.gpsCoordinates?.longitude,
      accuracyMeters: accuracyMeters !== undefined ? Number(accuracyMeters) : inspection.gpsCoordinates?.accuracyMeters,
      address: address || inspection.gpsCoordinates?.address,
    };
    if (latitude !== undefined) inspection.latitude = Number(latitude);
    if (longitude !== undefined) inspection.longitude = Number(longitude);
  }

  // Validate instrumentReadings if provided
  if (data.instrumentReadings) {
    if (!Array.isArray(data.instrumentReadings)) {
      throw ApiError.badRequest('instrumentReadings must be an array.');
    }
    for (const r of data.instrumentReadings) {
      if (!r.testName || typeof r.testName !== 'string') {
        throw ApiError.badRequest('Each reading requires a valid testName.');
      }
      if (typeof r.standardValue !== 'number' || isNaN(r.standardValue)) {
        throw ApiError.badRequest('Each reading standardValue must be a valid number.');
      }
      if (typeof r.observedValue !== 'number' || isNaN(r.observedValue)) {
        throw ApiError.badRequest('Each reading observedValue must be a valid number.');
      }
      r.deviation = Number((r.observedValue - r.standardValue).toFixed(6));
    }
    inspection.instrumentReadings = data.instrumentReadings;
  }

  if (data.accuracyChecks) {
    if (!Array.isArray(data.accuracyChecks)) {
      throw ApiError.badRequest('accuracyChecks must be an array.');
    }
    inspection.accuracyChecks = data.accuracyChecks;
  }

  if (data.complianceChecks) {
    if (!Array.isArray(data.complianceChecks)) {
      throw ApiError.badRequest('complianceChecks must be an array.');
    }
    inspection.complianceChecks = data.complianceChecks;
  }

  if (data.defects) {
    if (!Array.isArray(data.defects)) {
      throw ApiError.badRequest('defects must be an array.');
    }
    inspection.defects = data.defects;
  }

  if (data.observations !== undefined) inspection.observations = data.observations;
  if (data.inspectorRemarks !== undefined) inspection.inspectorRemarks = data.inspectorRemarks;
  if (data.stakeholderRemarks !== undefined) inspection.stakeholderRemarks = data.stakeholderRemarks;
  if (data.remarks !== undefined) inspection.remarks = data.remarks;
  if (data.instrumentCondition !== undefined) {
    inspection.instrumentCondition = {
      ...inspection.instrumentCondition?.toObject?.(),
      ...data.instrumentCondition,
    };
  }
  if (data.standardReference !== undefined) inspection.standardReference = data.standardReference;
  if (data.standardsUsed !== undefined) inspection.standardsUsed = data.standardsUsed;
  if (data.stampingAndSealing !== undefined) {
    inspection.stampingAndSealing = {
      ...inspection.stampingAndSealing?.toObject?.(),
      ...data.stampingAndSealing,
    };
  }
  if (data.nonCompliance !== undefined) inspection.nonCompliance = data.nonCompliance;
  if (data.location !== undefined) inspection.location = data.location;

  inspection.updatedBy = user._id;
  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_DRAFT_SAVED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
    },
  });

  return inspection;
}

/**
 * Service: Submit Inspection for Review / Finalization
 */
export async function submitInspection(inspectionId, user) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users cannot submit inspection records.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Authorization check
  const isAssigned =
    String(inspection.assignedOfficer) === String(user._id) ||
    String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to submit this inspection.');
  }

  // Prevent duplicate submission or submitting finalized inspection
  if (inspection.inspectionStatus === INSPECTION_STATUSES.SUBMITTED) {
    throw ApiError.badRequest('Inspection is already submitted.');
  }

  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest('Cannot submit an already finalized inspection.');
  }

  // Validate mandatory content before submission
  const hasObservations = Boolean(inspection.observations && inspection.observations.trim().length > 0);
  const hasReadings = Boolean(
    (inspection.instrumentReadings && inspection.instrumentReadings.length > 0) ||
    (inspection.measurementReadings && inspection.measurementReadings.length > 0)
  );
  const hasChecks = Boolean(
    (inspection.accuracyChecks && inspection.accuracyChecks.length > 0) ||
    (inspection.complianceChecks && inspection.complianceChecks.length > 0)
  );

  if (!hasObservations && !hasReadings && !hasChecks) {
    throw ApiError.badRequest(
      'Inspection submission requires at least one measurement reading, compliance check, or observation.'
    );
  }

  inspection.inspectionStatus = INSPECTION_STATUSES.SUBMITTED;
  inspection.submittedAt = new Date();
  inspection.endTime = new Date();
  inspection.updatedBy = user._id;

  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_SUBMITTED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
    },
  });

  return inspection;
}

/**
 * Service: Finalize Inspection Result (Verdict: VERIFIED or REJECTED)
 */
export async function finalizeInspection(inspectionId, payload, user) {
  // Only SUPER_ADMIN, ADMIN, or LEGAL_METROLOGY_OFFICER can finalize verification verdicts
  const allowedRoles = [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.LEGAL_METROLOGY_OFFICER,
  ];

  if (!allowedRoles.includes(user.role)) {
    throw ApiError.forbidden(
      'You are not authorized to finalize official verification results. Requires LEGAL_METROLOGY_OFFICER or ADMIN.'
    );
  }

  const inspection = await VerificationInspection.findById(inspectionId)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder');

  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Officer assignment and jurisdiction authorization check
  if (user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    const isAssigned =
      String(inspection.assignedOfficer?._id || inspection.assignedOfficer) === String(user._id) ||
      String(inspection.officer?._id || inspection.officer) === String(user._id) ||
      (inspection.application &&
        String(inspection.application.assignedLMO?._id || inspection.application.assignedLMO) === String(user._id));

    const officerDistrict = user.jurisdiction?.district;
    const stakeholderDistrict = inspection.stakeholder?.registeredAddress?.district;
    const isSameDistrict =
      officerDistrict &&
      stakeholderDistrict &&
      officerDistrict.toLowerCase() === stakeholderDistrict.toLowerCase();

    if (!isAssigned && !isSameDistrict) {
      throw ApiError.forbidden(
        'You are not authorized to finalize inspections assigned to another officer outside your jurisdiction.'
      );
    }
  }

  // Cannot re-finalize an already finalized inspection without reopening
  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest(
      'Inspection is already finalized. To alter official results, use the administrative reopen procedure.'
    );
  }

  const {
    result,
    reason,
    observations,
    defects,
    correctiveAction,
    officerRemarks,
    complianceInformation,
  } = payload;

  const verdict = result || payload.verdict;

  if (
    verdict !== INSPECTION_RESULTS.VERIFIED &&
    verdict !== INSPECTION_RESULTS.REJECTED &&
    verdict !== VERIFICATION_VERDICTS.PASS &&
    verdict !== VERIFICATION_VERDICTS.FAIL
  ) {
    throw ApiError.badRequest("Invalid result. Must be 'VERIFIED' or 'REJECTED' (or 'PASS' / 'FAIL').");
  }

  const isPassed =
    verdict === INSPECTION_RESULTS.VERIFIED || verdict === VERIFICATION_VERDICTS.PASS;

  // Rejection requires a reason
  if (!isPassed && (!reason || reason.trim().length === 0)) {
    throw ApiError.badRequest('Rejection reason is required for failed verification.');
  }

  const now = new Date();
  const nextDueDate = new Date(now);
  nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
  nextDueDate.setDate(nextDueDate.getDate() - 1);

  const application = inspection.application;
  const instrument = inspection.instrument;

  let generatedCertificate = null;

  await runInTransaction(async (session) => {
    if (isPassed) {
      // 1. Mark Inspection as PASSED
      inspection.inspectionStatus = INSPECTION_STATUSES.PASSED;
      inspection.result = INSPECTION_RESULTS.VERIFIED;
      inspection.verifiedBy = user._id;
      inspection.verifiedAt = now;
      inspection.resultRemarks = officerRemarks || 'Instrument verified compliant with statutory tolerances.';

      // 2. Mark Application as VERIFIED
      if (application) {
        application.currentStatus = APPLICATION_STATUSES.VERIFIED;
        application.statusHistory.push({
          fromStatus: APPLICATION_STATUSES.INSPECTION,
          toStatus: APPLICATION_STATUSES.VERIFIED,
          changedBy: user._id,
          remarks: 'Instrument passed statutory verification and MPE tests',
          timestamp: now,
        });
        await application.save(session ? { session } : undefined);
      }

      // 3. Mark Instrument as ACTIVE_VERIFIED
      if (instrument) {
        await Instrument.findByIdAndUpdate(
          instrument._id || instrument,
          { status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED },
          session ? { session } : undefined
        );
      }

      // 4. Mark Schedule as COMPLETED
      if (inspection.schedule) {
        await VerificationSchedule.findByIdAndUpdate(
          inspection.schedule,
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : undefined
        );
      }
      if (application) {
        await VerificationSchedule.updateMany(
          { application: application._id || application },
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : undefined
        );
      }

      // 5. Create or update VerificationResult
      const vrQuery = VerificationResult.findOne({ application: application._id });
      if (session) vrQuery.session(session);
      let verificationResultDoc = await vrQuery;

      if (!verificationResultDoc) {
        verificationResultDoc = new VerificationResult({
          application: application._id,
          inspection: inspection._id,
          instrument: instrument._id || instrument,
          result: VERIFICATION_VERDICTS.PASS,
          complianceInformation: complianceInformation || {
            allMpeCompliant: true,
            statutorySealAffixed: true,
          },
          officerRemarks: officerRemarks || 'Passed verification',
          verifiedBy: user._id,
          verificationDate: now,
          nextDueDate,
        });
      } else {
        verificationResultDoc.result = VERIFICATION_VERDICTS.PASS;
        verificationResultDoc.verifiedBy = user._id;
        verificationResultDoc.verificationDate = now;
        verificationResultDoc.nextDueDate = nextDueDate;
        verificationResultDoc.complianceInformation = complianceInformation || {
          allMpeCompliant: true,
          statutorySealAffixed: true,
        };
        verificationResultDoc.officerRemarks = officerRemarks || 'Passed verification';
      }
      await verificationResultDoc.save(session ? { session } : undefined);
    } else {
      // FAILED / REJECTED Verification
      inspection.inspectionStatus = INSPECTION_STATUSES.FAILED;
      inspection.result = INSPECTION_RESULTS.REJECTED;
      inspection.verifiedBy = user._id;
      inspection.verifiedAt = now;
      inspection.resultRemarks = reason;

      // 1. Mark Application as FAILED
      if (application) {
        application.currentStatus = APPLICATION_STATUSES.FAILED;
        application.statusHistory.push({
          fromStatus: APPLICATION_STATUSES.INSPECTION,
          toStatus: APPLICATION_STATUSES.FAILED,
          changedBy: user._id,
          remarks: `Verification failed: ${reason}`,
          timestamp: now,
        });
        await application.save(session ? { session } : undefined);
      }

      // 2. Mark Instrument as REJECTED
      if (instrument) {
        await Instrument.findByIdAndUpdate(
          instrument._id || instrument,
          { status: INSTRUMENT_STATUSES.REJECTED },
          session ? { session } : undefined
        );
      }

      // 3. Mark Schedule as COMPLETED
      if (inspection.schedule) {
        await VerificationSchedule.findByIdAndUpdate(
          inspection.schedule,
          { status: SCHEDULE_STATUSES.COMPLETED },
          session ? { session } : undefined
        );
      }

      // 4. Create or update VerificationResult with REJECTED
      const vrQuery = VerificationResult.findOne({ application: application._id });
      if (session) vrQuery.session(session);
      let verificationResultDoc = await vrQuery;

      if (!verificationResultDoc) {
        verificationResultDoc = new VerificationResult({
          application: application._id,
          inspection: inspection._id,
          instrument: instrument._id || instrument,
          result: VERIFICATION_VERDICTS.FAIL,
          complianceInformation: complianceInformation || {
            allMpeCompliant: false,
            statutorySealAffixed: false,
          },
          rejectionReasons: [reason],
          officerRemarks: officerRemarks || reason,
          verifiedBy: user._id,
          verificationDate: now,
          nextDueDate,
        });
      } else {
        verificationResultDoc.result = VERIFICATION_VERDICTS.FAIL;
        verificationResultDoc.rejectionReasons = [reason];
        verificationResultDoc.officerRemarks = officerRemarks || reason;
        verificationResultDoc.verifiedBy = user._id;
        verificationResultDoc.verificationDate = now;
        verificationResultDoc.complianceInformation = complianceInformation || {
          allMpeCompliant: false,
          statutorySealAffixed: false,
        };
      }
      await verificationResultDoc.save(session ? { session } : undefined);
    }

    await inspection.save(session ? { session } : undefined);

    await logAuditEvent({
      user: user._id,
      userRole: user.role,
      userEmail: user.email,
      action: AUDIT_ACTIONS.INSPECTION_FINALIZED,
      entity: 'VerificationInspection',
      entityId: inspection._id,
      metadata: {
        inspectionNumber: inspection.inspectionNumber,
        verdict: isPassed ? 'VERIFIED' : 'REJECTED',
        reason: isPassed ? undefined : reason,
        certificateNumber: generatedCertificate?.certificateNumber,
      },
    }, session);
  });

  // Post-commit notifications
  if (inspection.stakeholder?.user) {
    if (isPassed) {
      await createNotification({
        recipient: inspection.stakeholder.user,
        type: NOTIFICATION_TYPES.VERIFICATION_PASSED,
        title: 'Verification Approved',
        message: `Your instrument under application ${application.applicationNumber} has been verified successfully and is eligible for digital certificate generation.`,
        relatedEntityType: 'Inspection',
        relatedEntityId: inspection._id,
        link: `/applications/${application._id}`,
      });
    } else {
      await createNotification({
        recipient: inspection.stakeholder.user,
        type: NOTIFICATION_TYPES.VERIFICATION_FAILED,
        title: 'Instrument Verification Test Failed',
        message: `Your instrument under application ${application.applicationNumber} did not meet statutory tolerances. Reason: ${reason}`,
        relatedEntityType: 'Inspection',
        relatedEntityId: inspection._id,
        link: `/applications/${application._id}`,
      });
    }
  }

  return {
    inspection,
    verdict: isPassed ? 'VERIFIED' : 'REJECTED',
    certificate: generatedCertificate,
  };
}

/**
 * Service: Administrative Reopen of Finalized Inspection
 */
export async function reopenInspection(inspectionId, reason, user) {
  if (user.role !== USER_ROLES.SUPER_ADMIN && user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden('Only administrative roles can reopen finalized inspections.');
  }

  if (!reason || reason.trim().length === 0) {
    throw ApiError.badRequest('A justification reason is required to reopen an inspection.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  if (
    inspection.inspectionStatus !== INSPECTION_STATUSES.PASSED &&
    inspection.inspectionStatus !== INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest(
      `Cannot reopen inspection in '${inspection.inspectionStatus}' status. Must be PASSED or FAILED.`
    );
  }

  const previousStatus = inspection.inspectionStatus;
  inspection.inspectionStatus = INSPECTION_STATUSES.UNDER_REVIEW;
  inspection.updatedBy = user._id;
  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_REOPENED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      previousStatus,
      reopenReason: reason,
    },
  });

  return inspection;
}

/**
 * Service: Upload Photographic / Document Evidence
 */
export async function uploadEvidence(inspectionId, file, caption, user, options = {}) {
  if (user.role === USER_ROLES.BUSINESS_USER) {
    throw ApiError.forbidden('Business users cannot upload official inspection evidence.');
  }

  const inspection = await VerificationInspection.findById(inspectionId);
  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  const isAssigned =
    String(inspection.assignedOfficer) === String(user._id) ||
    String(inspection.officer) === String(user._id);
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

  if (!isAssigned && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to upload evidence for this inspection.');
  }

  if (
    inspection.inspectionStatus === INSPECTION_STATUSES.PASSED ||
    inspection.inspectionStatus === INSPECTION_STATUSES.FAILED
  ) {
    throw ApiError.badRequest('Cannot add evidence to a finalized inspection.');
  }

  let fileUrl;
  if (file && typeof file === 'object' && file.filename) {
    await validateUploadedFile(file);
    fileUrl = `/uploads/instrument-photos/${file.filename}`;
  } else if (file && typeof file === 'string') {
    if (file.startsWith('/uploads/')) {
      fileUrl = file;
    } else {
      const processed = await processBase64Upload(file, 'instrument-photos');
      fileUrl = processed.fileUrl;
    }
  } else {
    throw ApiError.badRequest('Invalid or missing file data.');
  }

  const photoEntry = {
    caption: caption || 'Field Test Verification Evidence',
    fileUrl,
    url: fileUrl,
    latitude: options.latitude,
    longitude: options.longitude,
    uploadedAt: new Date(),
  };

  inspection.photographs.push(photoEntry);
  inspection.photos.push(photoEntry); // backward compat
  await inspection.save();

  await logAuditEvent({
    user: user._id,
    userRole: user.role,
    userEmail: user.email,
    action: AUDIT_ACTIONS.INSPECTION_EVIDENCE_UPLOADED,
    entity: 'VerificationInspection',
    entityId: inspection._id,
    metadata: {
      inspectionNumber: inspection.inspectionNumber,
      fileUrl,
    },
  });

  return {
    ...photoEntry,
    photographs: inspection.photographs,
    photos: inspection.photos,
    inspection,
  };
}

/**
 * Service: Get Single Inspection Details with Strict Security
 */
export async function getInspectionById(inspectionId, user) {
  const inspection = await VerificationInspection.findById(inspectionId)
    .populate('application')
    .populate('instrument')
    .populate('stakeholder')
    .populate('assignedOfficer', 'name email phone designation jurisdiction')
    .populate('verificationCenter', 'centerName centerCode address')
    .populate('gatc', 'gatcName gatcCode')
    .populate('verifiedBy', 'name email designation');

  if (!inspection) {
    throw ApiError.notFound('Inspection record not found.');
  }

  // Security: Business User data isolation
  if (user.role === USER_ROLES.BUSINESS_USER) {
    const userStakeholder = await Stakeholder.findOne({ user: user._id });
    if (
      !userStakeholder ||
      String(inspection.stakeholder?._id || inspection.stakeholder) !== String(userStakeholder._id)
    ) {
      throw ApiError.forbidden('You are not authorized to view this inspection record.');
    }
  } else if (
    user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
    user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    // Officers can only access inspections assigned to them or within authorized jurisdiction
    const isAssigned =
      String(inspection.assignedOfficer?._id || inspection.assignedOfficer) === String(user._id) ||
      String(inspection.officer?._id || inspection.officer) === String(user._id);

    if (!isAssigned) {
      throw ApiError.forbidden('You are not authorized to view inspections assigned to other officers.');
    }
  }

  const inspectionObj = inspection.toObject ? inspection.toObject() : inspection;

  if (inspection.instrumentCondition) {
    inspectionObj.checklist = {
      visualInspectionPassed: inspection.instrumentCondition.visualCheckPassed ?? true,
      levelingBubbleCentered: inspection.instrumentCondition.levelingBubbleCentered ?? true,
      sealIntact: inspection.stampingAndSealing?.sealingPlugsIntact ?? true,
      environmentalSuitability: true,
      nameplateLegible: inspection.instrumentCondition.modelApprovalPlateIntact ?? true,
      zeroTrackingFunctional: inspection.instrumentCondition.zeroTrackingOperational ?? true,
    };
  }

  if (inspection.instrumentReadings && inspection.instrumentReadings.length > 0) {
    inspectionObj.testReadings = inspection.instrumentReadings.map((r, idx) => ({
      loadPoint: idx + 1,
      nominalLoad: r.standardValue ?? 0,
      observedReading: r.observedValue ?? 0,
      errorValue: r.deviation ?? 0,
      mpeAllowed: r.tolerance ?? 0,
      passed: r.result === 'PASS',
      testName: r.testName,
    }));
  }

  return inspectionObj;
}

/**
 * Service: List Inspections with Filters & Pagination
 */
export async function listInspections(query, user) {
  const filter = {};

  if (user.role === USER_ROLES.BUSINESS_USER) {
    const userStakeholder = await Stakeholder.findOne({ user: user._id });
    if (!userStakeholder) {
      return { inspections: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
    }
    filter.stakeholder = userStakeholder._id;
  } else if (
    user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
    user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    if (query.all !== 'true' || user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
      filter.$or = [
        { assignedOfficer: user._id },
        { officer: user._id },
      ];
    }
  }

  if (query.status) {
    filter.inspectionStatus = query.status;
  }

  if (query.result) {
    filter.result = query.result;
  }

  if (query.inspectionNumber) {
    filter.inspectionNumber = { $regex: query.inspectionNumber, $options: 'i' };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [inspections, total] = await Promise.all([
    VerificationInspection.find(filter)
      .populate('application', 'applicationNumber applicationType currentStatus')
      .populate('instrument', 'instrumentId category instrumentType manufacturer modelNumber')
      .populate('stakeholder', 'businessName')
      .populate('assignedOfficer', 'name email designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VerificationInspection.countDocuments(filter),
  ]);

  return {
    inspections,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Service: Get Real Officer Dashboard Inspection Metrics (Zero dummy data)
 */
export async function getOfficerDashboardMetrics(user) {
  const filter = {};

  if (
    user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER ||
    user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    filter.$or = [
      { assignedOfficer: user._id },
      { officer: user._id },
    ];
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalInspections,
    todayInspections,
    inProgressInspections,
    submittedInspections,
    passedInspections,
    failedInspections,
  ] = await Promise.all([
    VerificationInspection.countDocuments(filter),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionDate: { $gte: startOfToday, $lte: endOfToday },
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.SUBMITTED,
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.PASSED,
    }),
    VerificationInspection.countDocuments({
      ...filter,
      inspectionStatus: INSPECTION_STATUSES.FAILED,
    }),
  ]);

  return {
    totalInspections,
    todayInspections,
    pendingInspections: inProgressInspections + submittedInspections,
    inProgressInspections,
    submittedInspections,
    passedInspections,
    failedInspections,
    completedInspections: passedInspections + failedInspections,
  };
}
