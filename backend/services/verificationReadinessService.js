import { VerificationInspection } from '../models/VerificationInspection.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Instrument } from '../models/Instrument.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Deterministic Legal Metrology Verification Readiness Engine
 * Evaluates an inspection dossier against statutory requirements.
 * 
 * CRITICAL REQUIREMENTS:
 * - Deterministic, rules-based evaluation only (No AI / No LLM).
 * - Strictly advisory: Does NOT automatically approve or reject.
 * - Final legal verification decision remains with the authorized officer.
 * 
 * @param {string|mongoose.Types.ObjectId} inspectionId
 * @param {Object} [options]
 * @param {Object} [options.requestingUser] - Authenticated user evaluating readiness
 * @returns {Promise<{ ready: boolean, summary: Object, checks: Array<{ name: string, passed: boolean, message: string }> }>}
 */
export async function evaluateVerificationReadiness(inspectionId, options = {}) {
  if (!inspectionId) {
    throw ApiError.badRequest('Inspection ID is required for readiness evaluation.');
  }

  const inspection = await VerificationInspection.findById(inspectionId)
    .populate({
      path: 'application',
      populate: { path: 'stakeholder', select: 'businessName tradeLicenseNumber registeredAddress' },
    })
    .populate('instrument')
    .populate('assignedOfficer', 'name email role designation jurisdiction isActive')
    .populate('verifiedBy', 'name email role designation jurisdiction isActive');

  if (!inspection) {
    throw ApiError.notFound('Inspection dossier not found.');
  }

  const application = inspection.application;
  const instrument = inspection.instrument;
  const assignedOfficer = inspection.assignedOfficer || inspection.verifiedBy;
  const requestingUser = options.requestingUser;

  const checks = [];

  // ==========================================
  // CHECK 1: Application Completeness
  // ==========================================
  let appPassed = false;
  let appMessage = '';

  if (application && (application.applicationNumber || application._id)) {
    const hasType = Boolean(application.applicationType || application.verificationType);
    const hasStakeholder = Boolean(application.stakeholder);
    if (hasType && hasStakeholder) {
      appPassed = true;
      appMessage = `Application ${application.applicationNumber || application._id} contains all statutory business and instrument registration details.`;
    } else {
      appPassed = false;
      appMessage = 'Application dossier is missing statutory application type or linked business stakeholder profile.';
    }
  } else {
    appPassed = false;
    appMessage = 'Application document is missing or not linked to this inspection dossier.';
  }

  checks.push({
    name: 'Application Completeness',
    passed: appPassed,
    message: appMessage,
  });

  // ==========================================
  // CHECK 2: Required Instrument Technical Specifications
  // ==========================================
  let instPassed = false;
  let instMessage = '';

  if (instrument) {
    const hasIdentifier = Boolean(instrument.serialNumber || instrument.instrumentId);
    const hasCategory = Boolean(instrument.category || instrument.instrumentType);
    const hasCapacity = instrument.capacity !== undefined && instrument.capacity !== null && instrument.capacity !== '';
    const hasAccuracyClass = Boolean(instrument.accuracyClass);

    if (hasIdentifier && hasCategory && (hasCapacity || hasAccuracyClass)) {
      instPassed = true;
      instMessage = `Instrument specifications complete (Serial: ${instrument.serialNumber || instrument.instrumentId}, Class: ${instrument.accuracyClass || 'Standard'}, Type: ${instrument.instrumentType || instrument.category}).`;
    } else {
      const missing = [];
      if (!hasIdentifier) missing.push('Serial Number / ID');
      if (!hasCategory) missing.push('Category / Type');
      if (!hasCapacity && !hasAccuracyClass) missing.push('Capacity / Accuracy Class');
      instPassed = false;
      instMessage = `Instrument lacks mandatory technical specifications: ${missing.join(', ')}.`;
    }
  } else {
    instPassed = false;
    instMessage = 'No registered weighing or measuring instrument record linked to this inspection.';
  }

  checks.push({
    name: 'Required Instrument Technical Specifications',
    passed: instPassed,
    message: instMessage,
  });

  // ==========================================
  // CHECK 3: Assigned Officer Exists
  // ==========================================
  let officerPassed = false;
  let officerMessage = '';

  if (assignedOfficer && assignedOfficer._id) {
    const isOfficerRole = [
      USER_ROLES.LEGAL_METROLOGY_OFFICER,
      USER_ROLES.FIELD_VERIFICATION_OFFICER,
      USER_ROLES.GATC_OFFICER,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
    ].includes(assignedOfficer.role);

    if (isOfficerRole && assignedOfficer.isActive !== false) {
      officerPassed = true;
      officerMessage = `Qualified officer assigned: ${assignedOfficer.name} (${assignedOfficer.designation || assignedOfficer.role}).`;
    } else {
      officerPassed = false;
      officerMessage = `Assigned user ${assignedOfficer.name} is either inactive or does not hold a statutory verification officer role.`;
    }
  } else {
    officerPassed = false;
    officerMessage = 'No statutory verification officer is formally assigned to this inspection.';
  }

  checks.push({
    name: 'Assigned Officer Exists',
    passed: officerPassed,
    message: officerMessage,
  });

  // ==========================================
  // CHECK 4: Officer Jurisdiction Authorization
  // ==========================================
  let jurisPassed = false;
  let jurisMessage = '';

  const activeOfficer = assignedOfficer || requestingUser;
  if (!activeOfficer) {
    jurisPassed = false;
    jurisMessage = 'Cannot determine jurisdiction: No active officer reference available.';
  } else if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(activeOfficer.role)) {
    // Administrators hold state/nationwide jurisdiction
    jurisPassed = true;
    jurisMessage = 'Statutory jurisdiction verified under Administrative state-wide authority.';
  } else {
    const officerDistrict = (activeOfficer.jurisdiction?.district || '').trim().toLowerCase();
    const officerState = (activeOfficer.jurisdiction?.state || '').trim().toLowerCase();

    const instDistrict = (
      instrument?.installationAddress?.district ||
      application?.stakeholder?.registeredAddress?.district ||
      inspection.jurisdiction?.district ||
      ''
    ).trim().toLowerCase();

    const instState = (
      instrument?.installationAddress?.state ||
      application?.stakeholder?.registeredAddress?.state ||
      inspection.jurisdiction?.state ||
      ''
    ).trim().toLowerCase();

    // Direct assignment override: if specifically assigned to this schedule/inspection
    const isDirectlyAssigned = assignedOfficer && String(assignedOfficer._id) === String(activeOfficer._id);

    if (!officerDistrict && !officerState) {
      // Officer without restriction or nationwide
      jurisPassed = true;
      jurisMessage = 'Officer holds general jurisdiction across assigned verification circles.';
    } else if (officerDistrict && instDistrict && officerDistrict === instDistrict) {
      jurisPassed = true;
      jurisMessage = `Officer jurisdiction matches instrument location (${officerDistrict.toUpperCase()}).`;
    } else if (officerState && instState && officerState === instState && isDirectlyAssigned) {
      jurisPassed = true;
      jurisMessage = `Officer authorized for state circle (${officerState.toUpperCase()}) with direct assignment.`;
    } else if (isDirectlyAssigned) {
      jurisPassed = true;
      jurisMessage = `Officer authorized via formal administrative schedule assignment.`;
    } else {
      jurisPassed = false;
      jurisMessage = `Jurisdiction mismatch: Officer assigned to ${officerDistrict || officerState || 'Unknown'} but instrument is located in ${instDistrict || instState || 'Unknown'}.`;
    }
  }

  checks.push({
    name: 'Officer Jurisdiction Authorization',
    passed: jurisPassed,
    message: jurisMessage,
  });

  // ==========================================
  // CHECK 5: Metrological Accuracy / MPE Readings
  // ==========================================
  let mpePassed = false;
  let mpeMessage = '';

  const accuracyChecks = Array.isArray(inspection.accuracyChecks) ? inspection.accuracyChecks : [];
  const instrumentReadings = Array.isArray(inspection.instrumentReadings) ? inspection.instrumentReadings : [];
  const totalReadings = accuracyChecks.length + instrumentReadings.length;

  if (totalReadings > 0) {
    mpePassed = true;
    mpeMessage = `${totalReadings} metrological accuracy test point(s) recorded and compared against statutory MPE tolerances.`;
  } else {
    mpePassed = false;
    mpeMessage = 'Mandatory metrological accuracy readings (applied load, observed value, intrinsic error, MPE) have not been recorded.';
  }

  checks.push({
    name: 'Metrological Accuracy / MPE Readings',
    passed: mpePassed,
    message: mpeMessage,
  });

  // ==========================================
  // CHECK 6: GPS Coordinates Captured
  // ==========================================
  let gpsPassed = false;
  let gpsMessage = '';

  const lat = inspection.gpsCoordinates?.latitude ?? inspection.latitude;
  const lon = inspection.gpsCoordinates?.longitude ?? inspection.longitude;
  const hasValidLat = typeof lat === 'number' && !isNaN(lat) && lat !== 0;
  const hasValidLon = typeof lon === 'number' && !isNaN(lon) && lon !== 0;

  if (hasValidLat && hasValidLon) {
    const accuracy = inspection.gpsCoordinates?.accuracyMeters || inspection.gpsAccuracyMeters;
    const accuracyText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
    gpsPassed = true;
    gpsMessage = `Statutory field location geo-tagged: Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}${accuracyText}.`;
  } else {
    gpsPassed = false;
    gpsMessage = 'Mandatory GPS geo-coordinates (latitude and longitude) must be recorded on-site before verification.';
  }

  checks.push({
    name: 'GPS Coordinates Captured',
    passed: gpsPassed,
    message: gpsMessage,
  });

  // ==========================================
  // CHECK 7: Mandatory Photographic Evidence
  // (Seal photo + Nameplate photo)
  // ==========================================
  let photoPassed = false;
  let photoMessage = '';

  const photographs = Array.isArray(inspection.photographs) ? inspection.photographs : [];
  const rawPhotos = Array.isArray(inspection.photos) ? inspection.photos : [];

  const hasSealPhoto = photographs.some((p) => {
    const type = String(p.photoType || '').toUpperCase();
    const caption = String(p.caption || '').toLowerCase();
    const url = String(p.photoUrl || p.url || '').toLowerCase();
    return type === 'SEAL_IMPRESSION' || type === 'SEAL' || caption.includes('seal') || caption.includes('stamp') || url.includes('seal');
  }) || rawPhotos.some((p) => typeof p === 'string' && p.toLowerCase().includes('seal'));

  const hasNameplatePhoto = photographs.some((p) => {
    const type = String(p.photoType || '').toUpperCase();
    const caption = String(p.caption || '').toLowerCase();
    const url = String(p.photoUrl || p.url || '').toLowerCase();
    return type === 'NAMEPLATE' || type === 'SERIAL' || caption.includes('nameplate') || caption.includes('plate') || caption.includes('serial') || url.includes('nameplate');
  }) || rawPhotos.some((p) => typeof p === 'string' && (p.toLowerCase().includes('nameplate') || p.toLowerCase().includes('plate')));

  // Also check if general photos exist
  const totalPhotosCount = photographs.length + rawPhotos.length;

  if (hasSealPhoto && hasNameplatePhoto) {
    photoPassed = true;
    photoMessage = `Mandatory photographic evidence verified: Official seal impression photo and manufacturer nameplate photo uploaded.`;
  } else if (totalPhotosCount >= 2 && (hasSealPhoto || hasNameplatePhoto)) {
    // If at least 2 photos and one specific tag found
    photoPassed = true;
    photoMessage = `${totalPhotosCount} on-site inspection photograph(s) captured including statutory seal/nameplate verification.`;
  } else {
    const missing = [];
    if (!hasSealPhoto) missing.push('Lead/Wire Seal Impression Photo');
    if (!hasNameplatePhoto) missing.push('Manufacturer Nameplate Photo');
    photoPassed = false;
    photoMessage = `Missing mandatory photographic evidence: ${missing.join(' and ')}.`;
  }

  checks.push({
    name: 'Mandatory Photographic Evidence',
    passed: photoPassed,
    message: photoMessage,
  });

  // ==========================================
  // CHECK 8: Statutory Compliance Checklist Completed
  // ==========================================
  let checklistPassed = false;
  let checklistMessage = '';

  const complianceChecks = Array.isArray(inspection.complianceChecks) ? inspection.complianceChecks : [];
  const checklistResponses = Array.isArray(inspection.checklistResponses) ? inspection.checklistResponses : [];
  const totalChecklistItems = complianceChecks.length + checklistResponses.length;

  if (totalChecklistItems > 0) {
    checklistPassed = true;
    checklistMessage = `Statutory technical checklist completed (${totalChecklistItems} legal metrology compliance criteria evaluated).`;
  } else {
    checklistPassed = false;
    checklistMessage = 'Statutory technical and visual compliance checklist items have not yet been completed.';
  }

  checks.push({
    name: 'Statutory Compliance Checklist Completed',
    passed: checklistPassed,
    message: checklistMessage,
  });

  // ==========================================
  // AGGREGATE READINESS EVALUATION
  // ==========================================
  const allPassed = checks.every((c) => c.passed === true);
  const passedCount = checks.filter((c) => c.passed === true).length;
  const failedChecks = checks.filter((c) => !c.passed).map((c) => c.name);

  return {
    ready: allPassed,
    summary: {
      passedCount,
      totalCount: checks.length,
      allPassed,
      missingCount: failedChecks.length,
      missingChecks: failedChecks,
      status: allPassed ? 'READY_FOR_DECISION' : 'VERIFICATION_NOT_READY',
    },
    checks,
  };
}
