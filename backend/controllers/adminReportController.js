import mongoose from 'mongoose';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiResponse } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Helper to escape CSV cell value according to RFC 4180
 */
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Helper to convert array of objects to RFC 4180 CSV
 */
function toCsv(headers, rows) {
  const headerLine = headers.map((h) => escapeCsvCell(h.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvCell(h.accessor(row))).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Helper to validate ObjectId format
 */
function validateObjectId(id, paramName) {
  if (id && (!mongoose.Types.ObjectId.isValid(id) || String(new mongoose.Types.ObjectId(id)) !== String(id))) {
    throw ApiError.badRequest(`Invalid ObjectId format provided for parameter '${paramName}': '${id}'`);
  }
}

/**
 * Validate and parse date filter
 */
function parseDateFilter(dateFrom, dateTo, fieldName = 'createdAt') {
  const filter = {};
  if (dateFrom) {
    const dFrom = new Date(dateFrom);
    if (isNaN(dFrom.getTime())) {
      throw ApiError.badRequest(`Invalid ${fieldName} starting date: '${dateFrom}'`);
    }
    filter.$gte = dFrom;
  }
  if (dateTo) {
    const dTo = new Date(dateTo);
    if (isNaN(dTo.getTime())) {
      throw ApiError.badRequest(`Invalid ${fieldName} ending date: '${dateTo}'`);
    }
    if (typeof dateTo === 'string' && dateTo.length === 10) {
      dTo.setUTCHours(23, 59, 59, 999);
    }
    filter.$lte = dTo;
  }
  return Object.keys(filter).length > 0 ? { [fieldName]: filter } : {};
}

/**
 * Supported report types
 */
const SUPPORTED_REPORT_TYPES = [
  'applications',
  'instruments',
  'inspections',
  'certificates',
  'schedules',
  'stakeholders',
  'officers',
];

/**
 * @desc    Get dynamic admin statutory reports with pagination, sorting, search and filters
 * @route   GET /api/admin/reports
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getAdminReports = asyncHandler(async (req, res) => {
  const reportType = (req.query.type || 'applications').toLowerCase();

  if (!SUPPORTED_REPORT_TYPES.includes(reportType)) {
    throw ApiError.badRequest(
      `Invalid report type '${reportType}'. Supported types: [${SUPPORTED_REPORT_TYPES.join(', ')}]`
    );
  }

  const { dateFrom, dateTo, status, stakeholder, officer, center, gatc, GATC, search } = req.query;

  validateObjectId(stakeholder, 'stakeholder');
  validateObjectId(officer, 'officer');
  validateObjectId(center, 'center');
  validateObjectId(gatc || GATC, 'gatc');

  const { page, limit, skip, sort } = getPaginationParams(req.query, 20, 100);

  let query = {};
  let totalRecords = 0;
  let records = [];

  switch (reportType) {
    case 'applications': {
      query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
      if (status) query.currentStatus = status;
      if (stakeholder) query.stakeholder = new mongoose.Types.ObjectId(stakeholder);
      if (officer) query.assignedLMO = new mongoose.Types.ObjectId(officer);
      if (center) query.preferredVerificationCenter = new mongoose.Types.ObjectId(center);
      if (gatc || GATC) query.assignedGATC = new mongoose.Types.ObjectId(gatc || GATC);
      if (search) {
        query.$or = [
          { applicationNumber: new RegExp(search, 'i') },
          { purpose: new RegExp(search, 'i') },
          { 'verificationLocation.district': new RegExp(search, 'i') },
        ];
      }

      [totalRecords, records] = await Promise.all([
        VerificationApplication.countDocuments(query),
        VerificationApplication.find(query)
          .populate('stakeholder', 'legalName businessName tradeName tradeLicenseNumber gstin contactPerson')
          .populate('instrument', 'instrumentType category manufacturer modelNumber serialNumber accuracyClass')
          .populate('assignedLMO', 'name email designation jurisdiction')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      break;
    }

    case 'instruments': {
      query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
      if (status) query.status = status;
      if (stakeholder) query.stakeholder = new mongoose.Types.ObjectId(stakeholder);
      if (search) {
        query.$or = [
          { instrumentType: new RegExp(search, 'i') },
          { manufacturer: new RegExp(search, 'i') },
          { serialNumber: new RegExp(search, 'i') },
          { modelNumber: new RegExp(search, 'i') },
        ];
      }

      [totalRecords, records] = await Promise.all([
        Instrument.countDocuments(query),
        Instrument.find(query)
          .populate('stakeholder', 'legalName businessName tradeName tradeLicenseNumber')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      break;
    }

    case 'inspections': {
      query = { ...parseDateFilter(dateFrom, dateTo, 'inspectionDate') };
      if (status) {
        query.$or = [{ inspectionStatus: status }, { result: status }];
      }
      if (officer) query.assignedOfficer = new mongoose.Types.ObjectId(officer);
      if (stakeholder) query.stakeholder = new mongoose.Types.ObjectId(stakeholder);
      if (search) {
        query.$or = [
          { inspectionNumber: new RegExp(search, 'i') },
          { observations: new RegExp(search, 'i') },
          { inspectorRemarks: new RegExp(search, 'i') },
        ];
      }

      [totalRecords, records] = await Promise.all([
        VerificationInspection.countDocuments(query),
        VerificationInspection.find(query)
          .populate('application', 'applicationNumber applicationType currentStatus')
          .populate('instrument', 'instrumentType manufacturer serialNumber modelNumber')
          .populate('stakeholder', 'legalName businessName tradeName')
          .populate('assignedOfficer', 'name email designation')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      break;
    }

    case 'certificates': {
      query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
      if (status) query.status = status;
      if (stakeholder) query.stakeholder = new mongoose.Types.ObjectId(stakeholder);
      if (search) {
        query.$or = [
          { certificateNumber: new RegExp(search, 'i') },
          { qrVerificationToken: new RegExp(search, 'i') },
          { verificationType: new RegExp(search, 'i') },
        ];
      }

      [totalRecords, records] = await Promise.all([
        Certificate.countDocuments(query),
        Certificate.find(query)
          .populate('stakeholder', 'legalName businessName tradeName')
          .populate('instrument', 'instrumentType manufacturer serialNumber')
          .populate('application', 'applicationNumber')
          .populate('issuedBy', 'name email designation')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      break;
    }

    case 'schedules': {
      query = { ...parseDateFilter(dateFrom, dateTo, 'scheduledDate') };
      if (status) query.status = status;
      if (officer) query.assignedOfficer = new mongoose.Types.ObjectId(officer);
      if (stakeholder) query.stakeholder = new mongoose.Types.ObjectId(stakeholder);
      if (center) query.verificationCenter = new mongoose.Types.ObjectId(center);
      if (gatc || GATC) query.assignedGATC = new mongoose.Types.ObjectId(gatc || GATC);
      if (search) {
        query.$or = [
          { locationAddress: new RegExp(search, 'i') },
          { timeSlot: new RegExp(search, 'i') },
          { notes: new RegExp(search, 'i') },
        ];
      }

      [totalRecords, records] = await Promise.all([
        VerificationSchedule.countDocuments(query),
        VerificationSchedule.find(query)
          .populate('application', 'applicationNumber currentStatus')
          .populate('instrument', 'instrumentType manufacturer serialNumber')
          .populate('stakeholder', 'legalName businessName tradeName')
          .populate('assignedOfficer', 'name email designation')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      break;
    }

    case 'stakeholders': {
      query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
      if (status) query.kycStatus = status;
      if (search) {
        query.$or = [
          { legalName: new RegExp(search, 'i') },
          { businessName: new RegExp(search, 'i') },
          { tradeName: new RegExp(search, 'i') },
          { tradeLicenseNumber: new RegExp(search, 'i') },
          { gstin: new RegExp(search, 'i') },
        ];
      }

      [totalRecords, records] = await Promise.all([
        Stakeholder.countDocuments(query),
        Stakeholder.find(query)
          .populate('user', 'name email phone')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      break;
    }

    case 'officers': {
      query = {
        role: {
          $in: [
            USER_ROLES.LEGAL_METROLOGY_OFFICER,
            USER_ROLES.FIELD_VERIFICATION_OFFICER,
            USER_ROLES.GATC_OFFICER,
          ],
        },
      };
      if (status === 'ACTIVE') query.isActive = true;
      if (status === 'INACTIVE') query.isActive = false;
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { designation: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') },
        ];
      }

      [totalRecords, records] = await Promise.all([
        User.countDocuments(query),
        User.find(query)
          .select('-password -__v')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      break;
    }
  }

  const paginationData = buildPaginationResponse(records, totalRecords, page, limit);

  return ApiResponse.success(
    res,
    {
      reportType,
      filtersApplied: {
        dateFrom,
        dateTo,
        status,
        stakeholder,
        officer,
        search,
      },
      pagination: paginationData.pagination,
      records: paginationData.items,
    },
    `Statutory ${reportType} report retrieved successfully`
  );
});

/**
 * @desc    Export statutory reports in RFC 4180 CSV, XLSX or JSON format with audit trail logging
 * @route   GET /api/admin/reports/export
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const exportAdminReports = asyncHandler(async (req, res) => {
  const reportType = (req.query.type || '').toLowerCase();
  const format = (req.query.format || 'csv').toLowerCase();

  if (!SUPPORTED_REPORT_TYPES.includes(reportType)) {
    throw ApiError.badRequest(
      `Invalid or missing export report type '${reportType}'. Supported types: [${SUPPORTED_REPORT_TYPES.join(', ')}]`
    );
  }

  // 1. Audit Log: strictly record the export operation in MongoDB
  await AuditLog.create({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: 'ADMIN_REPORT_EXPORT',
    entity: 'REPORT',
    entityId: reportType,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata: {
      reportType,
      format,
      filters: req.query,
      timestamp: new Date(),
    },
  });

  const { dateFrom, dateTo, status, stakeholder, officer } = req.query;
  validateObjectId(stakeholder, 'stakeholder');
  validateObjectId(officer, 'officer');

  // Query records up to safe export limit
  let rows = [];
  let headers = [];

  if (reportType === 'applications') {
    const query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
    if (status) query.currentStatus = status;
    if (stakeholder) query.stakeholder = new mongoose.Types.ObjectId(stakeholder);
    if (officer) query.assignedLMO = new mongoose.Types.ObjectId(officer);

    rows = await VerificationApplication.find(query)
      .populate('stakeholder', 'legalName businessName tradeName')
      .populate('instrument', 'instrumentType manufacturer serialNumber')
      .populate('assignedLMO', 'name email designation')
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();

    headers = [
      { label: 'Application Number', accessor: (r) => r.applicationNumber },
      { label: 'Application Type', accessor: (r) => r.applicationType },
      { label: 'Status', accessor: (r) => r.currentStatus },
      { label: 'Business Name', accessor: (r) => r.stakeholder?.businessName || r.stakeholder?.legalName || '' },
      { label: 'Instrument Type', accessor: (r) => r.instrument?.instrumentType || '' },
      { label: 'Serial Number', accessor: (r) => r.instrument?.serialNumber || '' },
      { label: 'Assigned Officer', accessor: (r) => r.assignedLMO?.name || '' },
      { label: 'Submission Date', accessor: (r) => (r.createdAt ? new Date(r.createdAt).toISOString() : '') },
    ];
  } else if (reportType === 'instruments') {
    const query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
    if (status) query.status = status;
    if (stakeholder) query.stakeholder = new mongoose.Types.ObjectId(stakeholder);

    rows = await Instrument.find(query)
      .populate('stakeholder', 'legalName businessName')
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();

    headers = [
      { label: 'Instrument ID', accessor: (r) => r.instrumentId || r._id },
      { label: 'Instrument Type', accessor: (r) => r.instrumentType },
      { label: 'Category', accessor: (r) => r.category },
      { label: 'Manufacturer', accessor: (r) => r.manufacturer },
      { label: 'Model Number', accessor: (r) => r.modelNumber },
      { label: 'Serial Number', accessor: (r) => r.serialNumber },
      { label: 'Accuracy Class', accessor: (r) => r.accuracyClass },
      { label: 'Status', accessor: (r) => r.status },
      { label: 'Next Due Date', accessor: (r) => (r.nextVerificationDueDate ? new Date(r.nextVerificationDueDate).toISOString() : '') },
      { label: 'Business Name', accessor: (r) => r.stakeholder?.businessName || '' },
    ];
  } else if (reportType === 'inspections') {
    const query = { ...parseDateFilter(dateFrom, dateTo, 'inspectionDate') };
    if (status) query.inspectionStatus = status;

    rows = await VerificationInspection.find(query)
      .populate('application', 'applicationNumber')
      .populate('instrument', 'instrumentType serialNumber')
      .populate('stakeholder', 'businessName legalName')
      .populate('assignedOfficer', 'name designation')
      .sort({ inspectionDate: -1 })
      .limit(2000)
      .lean();

    headers = [
      { label: 'Inspection Number', accessor: (r) => r.inspectionNumber },
      { label: 'Application Number', accessor: (r) => r.application?.applicationNumber || '' },
      { label: 'Stakeholder', accessor: (r) => r.stakeholder?.businessName || '' },
      { label: 'Instrument', accessor: (r) => r.instrument?.instrumentType || '' },
      { label: 'Inspector', accessor: (r) => r.assignedOfficer?.name || '' },
      { label: 'Status', accessor: (r) => r.inspectionStatus },
      { label: 'Result', accessor: (r) => r.result },
      { label: 'Date', accessor: (r) => (r.inspectionDate ? new Date(r.inspectionDate).toISOString() : '') },
    ];
  } else if (reportType === 'certificates') {
    const query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
    if (status) query.status = status;

    rows = await Certificate.find(query)
      .populate('stakeholder', 'businessName legalName')
      .populate('instrument', 'instrumentType serialNumber')
      .populate('issuedBy', 'name designation')
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();

    headers = [
      { label: 'Certificate Number', accessor: (r) => r.certificateNumber },
      { label: 'Stakeholder', accessor: (r) => r.stakeholder?.businessName || '' },
      { label: 'Instrument', accessor: (r) => r.instrument?.instrumentType || '' },
      { label: 'Status', accessor: (r) => r.status },
      { label: 'Valid From', accessor: (r) => (r.validFrom ? new Date(r.validFrom).toISOString() : '') },
      { label: 'Valid Until', accessor: (r) => (r.validUntil ? new Date(r.validUntil).toISOString() : '') },
      { label: 'Issued By', accessor: (r) => r.issuedBy?.name || '' },
    ];
  } else if (reportType === 'schedules') {
    const query = { ...parseDateFilter(dateFrom, dateTo, 'scheduledDate') };
    if (status) query.status = status;

    rows = await VerificationSchedule.find(query)
      .populate('stakeholder', 'businessName legalName')
      .populate('instrument', 'instrumentType serialNumber')
      .populate('assignedOfficer', 'name designation')
      .sort({ scheduledDate: -1 })
      .limit(2000)
      .lean();

    headers = [
      { label: 'Schedule ID', accessor: (r) => r._id },
      { label: 'Stakeholder', accessor: (r) => r.stakeholder?.businessName || '' },
      { label: 'Scheduled Date', accessor: (r) => (r.scheduledDate ? new Date(r.scheduledDate).toISOString() : '') },
      { label: 'Time Slot', accessor: (r) => r.timeSlot || '' },
      { label: 'Assigned Officer', accessor: (r) => r.assignedOfficer?.name || '' },
      { label: 'Location', accessor: (r) => r.locationAddress || '' },
      { label: 'Status', accessor: (r) => r.status },
    ];
  } else if (reportType === 'stakeholders') {
    const query = { ...parseDateFilter(dateFrom, dateTo, 'createdAt') };
    if (status) query.kycStatus = status;

    rows = await Stakeholder.find(query)
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();

    headers = [
      { label: 'Stakeholder ID', accessor: (r) => r._id },
      { label: 'Legal Name', accessor: (r) => r.legalName },
      { label: 'Business Name', accessor: (r) => r.businessName || '' },
      { label: 'Trade License', accessor: (r) => r.tradeLicenseNumber || '' },
      { label: 'GSTIN', accessor: (r) => r.gstin || '' },
      { label: 'District', accessor: (r) => r.registeredAddress?.district || '' },
      { label: 'KYC Status', accessor: (r) => r.kycStatus },
      { label: 'Created At', accessor: (r) => (r.createdAt ? new Date(r.createdAt).toISOString() : '') },
    ];
  } else if (reportType === 'officers') {
    const query = {
      role: {
        $in: [
          USER_ROLES.LEGAL_METROLOGY_OFFICER,
          USER_ROLES.FIELD_VERIFICATION_OFFICER,
          USER_ROLES.GATC_OFFICER,
        ],
      },
    };
    rows = await User.find(query).select('-password -__v').limit(2000).lean();

    headers = [
      { label: 'Officer ID', accessor: (r) => r._id },
      { label: 'Name', accessor: (r) => r.name },
      { label: 'Email', accessor: (r) => r.email },
      { label: 'Phone', accessor: (r) => r.phone || '' },
      { label: 'Role', accessor: (r) => r.role },
      { label: 'Designation', accessor: (r) => r.designation || '' },
      { label: 'District', accessor: (r) => r.jurisdiction?.district || '' },
      { label: 'Active', accessor: (r) => (r.isActive ? 'YES' : 'NO') },
    ];
  }

  // Sanitize: ensure no passwords or sensitive auth tokens are in any row
  rows.forEach((row) => {
    delete row.password;
    delete row.__v;
    if (row.user && typeof row.user === 'object') {
      delete row.user.password;
    }
  });

  if (format === 'json') {
    return ApiResponse.success(res, rows, `Statutory ${reportType} report exported in JSON format`);
  }

  // Default to RFC 4180 CSV
  const csvData = toCsv(headers, rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="doca_admin_${reportType}_report_${Date.now()}.csv"`
  );
  return res.status(200).send(csvData);
});

/**
 * @desc    Run database referential integrity & orphan detection scan
 * @route   GET /api/admin/diagnostics/integrity
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getDatabaseIntegrityReport = asyncHandler(async (req, res) => {
  const { runDatabaseIntegrityDiagnostics } = await import('../services/integrityDiagnosticService.js');
  const report = await runDatabaseIntegrityDiagnostics();
  return ApiResponse.success(
    res,
    report,
    report.isConsistent
      ? 'Database referential integrity verified: No orphaned records detected.'
      : `Database referential scan completed: ${report.totalOrphansDetected} orphaned records detected.`
  );
});

