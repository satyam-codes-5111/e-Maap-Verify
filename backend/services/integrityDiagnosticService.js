import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { VerificationResult } from '../models/VerificationResult.js';

/**
 * Diagnostic service to inspect database referential consistency and identify any orphaned records.
 * Strictly READ-ONLY: does not modify or delete any database records.
 */
export async function runDatabaseIntegrityDiagnostics() {
  const timestamp = new Date().toISOString();

  // 1. Instruments without valid Stakeholder
  const orphanInstruments = await Instrument.aggregate([
    {
      $lookup: {
        from: 'stakeholders',
        localField: 'stakeholder',
        foreignField: '_id',
        as: 'stakeholderDoc',
      },
    },
    {
      $match: {
        'stakeholderDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, instrumentId: 1, stakeholder: 1 },
    },
  ]);

  // 2. Applications without valid Stakeholder
  const orphanApplicationsStakeholder = await VerificationApplication.aggregate([
    {
      $lookup: {
        from: 'stakeholders',
        localField: 'stakeholder',
        foreignField: '_id',
        as: 'stakeholderDoc',
      },
    },
    {
      $match: {
        'stakeholderDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, applicationNumber: 1, stakeholder: 1 },
    },
  ]);

  // 3. Applications without valid Instrument
  const orphanApplicationsInstrument = await VerificationApplication.aggregate([
    {
      $lookup: {
        from: 'instruments',
        localField: 'instrument',
        foreignField: '_id',
        as: 'instrumentDoc',
      },
    },
    {
      $match: {
        'instrumentDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, applicationNumber: 1, instrument: 1 },
    },
  ]);

  // 4. Schedules without valid Application
  const orphanSchedules = await VerificationSchedule.aggregate([
    {
      $lookup: {
        from: 'verificationapplications',
        localField: 'application',
        foreignField: '_id',
        as: 'appDoc',
      },
    },
    {
      $match: {
        'appDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, application: 1, status: 1 },
    },
  ]);

  // 5. Inspections without valid Application
  const orphanInspections = await VerificationInspection.aggregate([
    {
      $lookup: {
        from: 'verificationapplications',
        localField: 'application',
        foreignField: '_id',
        as: 'appDoc',
      },
    },
    {
      $match: {
        'appDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, inspectionNumber: 1, application: 1 },
    },
  ]);

  // 6. Certificates without valid Application
  const orphanCertificatesApp = await Certificate.aggregate([
    {
      $lookup: {
        from: 'verificationapplications',
        localField: 'application',
        foreignField: '_id',
        as: 'appDoc',
      },
    },
    {
      $match: {
        'appDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, certificateNumber: 1, application: 1 },
    },
  ]);

  // 7. Certificates without valid Instrument
  const orphanCertificatesInstrument = await Certificate.aggregate([
    {
      $lookup: {
        from: 'instruments',
        localField: 'instrument',
        foreignField: '_id',
        as: 'instrumentDoc',
      },
    },
    {
      $match: {
        'instrumentDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, certificateNumber: 1, instrument: 1 },
    },
  ]);

  // 8. VerificationResults without valid Application
  const orphanResults = await VerificationResult.aggregate([
    {
      $lookup: {
        from: 'verificationapplications',
        localField: 'application',
        foreignField: '_id',
        as: 'appDoc',
      },
    },
    {
      $match: {
        'appDoc.0': { $exists: false },
      },
    },
    {
      $project: { _id: 1, application: 1, result: 1 },
    },
  ]);

  const totalOrphans =
    orphanInstruments.length +
    orphanApplicationsStakeholder.length +
    orphanApplicationsInstrument.length +
    orphanSchedules.length +
    orphanInspections.length +
    orphanCertificatesApp.length +
    orphanCertificatesInstrument.length +
    orphanResults.length;

  return {
    timestamp,
    status: totalOrphans === 0 ? 'HEALTHY_CONSISTENT' : 'ORPHANS_DETECTED',
    isConsistent: totalOrphans === 0,
    totalOrphansDetected: totalOrphans,
    breakdown: {
      orphanInstrumentsCount: orphanInstruments.length,
      orphanInstruments,
      orphanApplicationsMissingStakeholderCount: orphanApplicationsStakeholder.length,
      orphanApplicationsMissingStakeholder: orphanApplicationsStakeholder,
      orphanApplicationsMissingInstrumentCount: orphanApplicationsInstrument.length,
      orphanApplicationsMissingInstrument: orphanApplicationsInstrument,
      orphanSchedulesCount: orphanSchedules.length,
      orphanSchedules,
      orphanInspectionsCount: orphanInspections.length,
      orphanInspections,
      orphanCertificatesMissingAppCount: orphanCertificatesApp.length,
      orphanCertificatesMissingApp: orphanCertificatesApp,
      orphanCertificatesMissingInstrumentCount: orphanCertificatesInstrument.length,
      orphanCertificatesMissingInstrument: orphanCertificatesInstrument,
      orphanVerificationResultsCount: orphanResults.length,
      orphanVerificationResults: orphanResults,
    },
  };
}
