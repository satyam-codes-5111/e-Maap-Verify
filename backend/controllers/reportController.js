import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { Certificate } from '../models/Certificate.js';
import { Instrument } from '../models/Instrument.js';
import { User } from '../models/User.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import { escapeRegex } from '../utils/securityUtils.js';
import { USER_ROLES, INSTRUMENT_STATUSES } from '../config/constants.js';

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
 * Helper to convert array of objects to CSV string
 */
function toCsv(headers, rows) {
  const headerLine = headers.map((h) => escapeCsvCell(h.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvCell(h.accessor(row))).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * @desc    Get Verification Summary Report with Filters and Aggregations
 * @route   GET /api/reports/summary
 * @access  Private (SUPER_ADMIN, ADMIN, LEGAL_METROLOGY_OFFICER)
 */
export const getVerificationSummaryReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, district, status, category, applicationType } = req.query;
  const matchFilter = {};

  if (startDate && endDate) {
    matchFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  if (status) {
    matchFilter.currentStatus = status;
  }
  if (district) {
    matchFilter['verificationLocation.district'] = new RegExp(district, 'i');
  }
  if (applicationType) {
    matchFilter.applicationType = applicationType;
  }

  // Handle pagination params
  const { page, limit, skip } = getPaginationParams(req.query, 50, 500);

  // If category filter is supplied, lookup instruments matching category
  if (category) {
    const matchingInstruments = await Instrument.find({ category }).select('_id');
    const instrumentIds = matchingInstruments.map((inst) => inst._id);
    matchFilter.instrument = { $in: instrumentIds };
  }

  const [reportData, totalCount, aggregateSummary, feeAggregation, resultsAgg] = await Promise.all([
    VerificationApplication.find(matchFilter)
      .populate('stakeholder', 'businessName tradeLicenseNumber')
      .populate('instrument', 'instrumentId category manufacturer modelNumber serialNumber accuracyClass')
      .populate('assignedLMO', 'name designation email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    VerificationApplication.countDocuments(matchFilter),
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$currentStatus',
          totalCount: { $sum: 1 },
          totalFees: { $sum: '$feeDetails.amount' },
        },
      },
      { $project: { status: '$_id', count: '$totalCount', totalFees: 1, _id: 0 } },
    ]),
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalFees: { $sum: '$feeDetails.amount' },
          paidFees: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PAID'] }, '$feeDetails.amount', 0] },
          },
          pendingFees: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PENDING'] }, '$feeDetails.amount', 0] },
          },
        },
      },
    ]),
    VerificationResult.aggregate([
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          passedCount: { $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$result', 'FAIL'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const fees = feeAggregation[0] || { totalFees: 0, paidFees: 0, pendingFees: 0 };
  const results = resultsAgg[0] || { totalResults: 0, passedCount: 0, failedCount: 0 };
  const passRate =
    results.totalResults > 0
      ? Number(((results.passedCount / results.totalResults) * 100).toFixed(1))
      : 0;

  const paginatedResponse = buildPaginationResponse(reportData, totalCount, page, limit);

  return ApiResponse.success(
    res,
    {
      reportData,
      items: reportData,
      pagination: paginatedResponse.pagination,
      summary: aggregateSummary,
      metrics: {
        totalCount,
        totalFees: fees.totalFees,
        paidFees: fees.paidFees,
        pendingFees: fees.pendingFees,
        passedInspections: results.passedCount,
        failedInspections: results.failedCount,
        passRate,
      },
    },
    'Verification summary report generated from live database'
  );
});

/**
 * @desc    Get Revenue & Fee Collection Report
 * @route   GET /api/reports/revenue
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, district, paymentStatus } = req.query;
  const matchFilter = {};

  if (startDate && endDate) {
    matchFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  if (district) {
    matchFilter['verificationLocation.district'] = new RegExp(district, 'i');
  }
  if (paymentStatus) {
    matchFilter['feeDetails.paymentStatus'] = paymentStatus;
  }

  const [totalsAgg, byCategoryAgg, byDistrictAgg, byStatusAgg, monthlyAgg] = await Promise.all([
    // Totals
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAssessed: { $sum: '$feeDetails.amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PAID'] }, '$feeDetails.amount', 0] },
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PENDING'] }, '$feeDetails.amount', 0] },
          },
          totalTransactions: { $sum: 1 },
          paidTransactions: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PAID'] }, 1, 0] },
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PENDING'] }, 1, 0] },
          },
        },
      },
    ]),

    // Revenue by Instrument Category
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'instruments',
          localField: 'instrument',
          foreignField: '_id',
          as: 'instrumentData',
        },
      },
      { $unwind: { path: '$instrumentData', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$instrumentData.category',
          totalAmount: { $sum: '$feeDetails.amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PAID'] }, '$feeDetails.amount', 0] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: { $ifNull: ['$_id', 'OTHER'] },
          totalAmount: 1,
          paidAmount: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),

    // Revenue by District
    VerificationApplication.aggregate([
      { $match: matchFilter },
      { $match: { 'verificationLocation.district': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$verificationLocation.district',
          totalAmount: { $sum: '$feeDetails.amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PAID'] }, '$feeDetails.amount', 0] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          district: '$_id',
          totalAmount: 1,
          paidAmount: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),

    // Revenue by Payment Status
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$feeDetails.paymentStatus',
          totalAmount: { $sum: '$feeDetails.amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          paymentStatus: '$_id',
          totalAmount: 1,
          count: 1,
          _id: 0,
        },
      },
    ]),

    // Monthly collection trend
    VerificationApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalAmount: { $sum: '$feeDetails.amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PAID'] }, '$feeDetails.amount', 0] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          totalAmount: 1,
          paidAmount: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]),
  ]);

  const totals = totalsAgg[0] || {
    totalAssessed: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalTransactions: 0,
    paidTransactions: 0,
    pendingTransactions: 0,
  };

  return ApiResponse.success(
    res,
    {
      totals,
      byCategory: byCategoryAgg,
      byDistrict: byDistrictAgg,
      byPaymentStatus: byStatusAgg,
      monthlyTrend: monthlyAgg,
    },
    'Revenue and statutory fee collection report generated successfully'
  );
});

/**
 * @desc    Get Instruments Statutory Compliance Report
 * @route   GET /api/reports/instruments-compliance
 * @access  Private (SUPER_ADMIN, ADMIN, LEGAL_METROLOGY_OFFICER)
 */
export const getInstrumentComplianceReport = asyncHandler(async (req, res) => {
  const { category, manufacturer, district } = req.query;
  const matchFilter = {};
  const now = new Date();

  if (category) {
    matchFilter.category = category;
  }
  if (manufacturer) {
    matchFilter.manufacturer = new RegExp(manufacturer, 'i');
  }

  const [
    totalInstruments,
    verifiedInstruments,
    unverifiedInstruments,
    overdueInstruments,
    categoryBreakdown,
    accuracyBreakdown,
    topManufacturers,
    overdueSample,
  ] = await Promise.all([
    Instrument.countDocuments(matchFilter),
    Instrument.countDocuments({ ...matchFilter, status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED }),
    Instrument.countDocuments({
      ...matchFilter,
      status: {
        $in: [
          INSTRUMENT_STATUSES.REGISTERED_UNVERIFIED,
          INSTRUMENT_STATUSES.PENDING_VERIFICATION,
        ],
      },
    }),
    Instrument.countDocuments({
      ...matchFilter,
      nextVerificationDueDate: { $lt: now },
    }),
    Instrument.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', INSTRUMENT_STATUSES.ACTIVE_VERIFIED] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$nextVerificationDueDate', null] },
                    { $lt: ['$nextVerificationDueDate', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          verified: 1,
          overdue: 1,
          _id: 0,
        },
      },
      { $sort: { total: -1 } },
    ]),
    Instrument.aggregate([
      { $match: { ...matchFilter, accuracyClass: { $ne: null } } },
      { $group: { _id: '$accuracyClass', count: { $sum: 1 } } },
      { $project: { accuracyClass: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
    Instrument.aggregate([
      { $match: { ...matchFilter, manufacturer: { $exists: true, $ne: '' } } },
      { $group: { _id: '$manufacturer', count: { $sum: 1 } } },
      { $project: { manufacturer: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Instrument.find({
      ...matchFilter,
      nextVerificationDueDate: { $lt: now },
    })
      .populate('stakeholder', 'businessName tradeLicenseNumber')
      .select('instrumentId category modelNumber serialNumber nextVerificationDueDate stakeholder')
      .sort({ nextVerificationDueDate: 1 })
      .limit(20),
  ]);

  const complianceRate =
    totalInstruments > 0
      ? Number(((verifiedInstruments / totalInstruments) * 100).toFixed(1))
      : 0;

  return ApiResponse.success(
    res,
    {
      overview: {
        totalInstruments,
        verifiedInstruments,
        unverifiedInstruments,
        overdueInstruments,
        complianceRate,
      },
      categoryBreakdown,
      accuracyBreakdown,
      topManufacturers,
      overdueSample,
    },
    'Statutory instrument compliance report generated successfully'
  );
});

/**
 * @desc    Get Officer Performance & Workload Analytics Report
 * @route   GET /api/reports/officer-performance
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getOfficerPerformanceReport = asyncHandler(async (req, res) => {
  const officers = await User.find({
    role: {
      $in: [
        USER_ROLES.LEGAL_METROLOGY_OFFICER,
        USER_ROLES.FIELD_VERIFICATION_OFFICER,
        USER_ROLES.GATC_OFFICER,
      ],
    },
  }).select('name email designation role jurisdiction');

  const performanceList = await Promise.all(
    officers.map(async (officer) => {
      const [assignedCount, completedInspections, passedCount, failedCount, activeSchedules] =
        await Promise.all([
          VerificationApplication.countDocuments({ assignedLMO: officer._id }),
          VerificationResult.countDocuments({ verifiedBy: officer._id }),
          VerificationResult.countDocuments({ verifiedBy: officer._id, result: 'PASS' }),
          VerificationResult.countDocuments({ verifiedBy: officer._id, result: 'FAIL' }),
          VerificationSchedule.countDocuments({
            assignedOfficer: officer._id,
            status: 'SCHEDULED',
          }),
        ]);

      const totalTested = passedCount + failedCount;
      const passRate =
        totalTested > 0 ? Number(((passedCount / totalTested) * 100).toFixed(1)) : 0;

      return {
        officerId: officer._id,
        name: officer.name,
        email: officer.email,
        designation: officer.designation || 'LMO',
        role: officer.role,
        jurisdiction: officer.jurisdiction || 'All',
        assignedCount,
        completedInspections,
        activeSchedules,
        passedCount,
        failedCount,
        passRate,
      };
    })
  );

  return ApiResponse.success(
    res,
    { officers: performanceList },
    'Officer performance report generated successfully'
  );
});

/**
 * @desc    Get Audit Logs with Pagination & Filtering
 * @route   GET /api/reports/audit-logs
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, 20, 100);
  const filter = {};

  if (req.query.action) {
    filter.action = req.query.action;
  }
  if (req.query.entity) {
    filter.entity = req.query.entity;
  }
  if (req.query.userEmail) {
    filter.userEmail = new RegExp(escapeRegex(req.query.userEmail), 'i');
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { action: { $regex: safeSearch, $options: 'i' } },
      { entity: { $regex: safeSearch, $options: 'i' } },
      { userEmail: { $regex: safeSearch, $options: 'i' } },
      { userRole: { $regex: safeSearch, $options: 'i' } },
      { ipAddress: { $regex: safeSearch, $options: 'i' } },
      { entityId: { $regex: safeSearch, $options: 'i' } },
    ];
  }
  if (req.query.startDate && req.query.endDate) {
    filter.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'name email role designation')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    buildPaginationResponse(logs, total, page, limit, 'logs'),
    'Audit logs retrieved successfully'
  );
});

/**
 * @desc    Export Reports to CSV or JSON formats
 * @route   GET /api/reports/export
 * @access  Private (SUPER_ADMIN, ADMIN, LEGAL_METROLOGY_OFFICER)
 */
export const exportReport = asyncHandler(async (req, res) => {
  const { reportType = 'summary', format = 'csv' } = req.query;

  if (reportType === 'summary') {
    const apps = await VerificationApplication.find()
      .populate('stakeholder', 'businessName tradeLicenseNumber')
      .populate('instrument', 'instrumentId category manufacturer modelNumber serialNumber')
      .populate('assignedLMO', 'name designation')
      .sort({ createdAt: -1 })
      .limit(1000);

    if (format === 'csv') {
      const headers = [
        { label: 'Application Number', accessor: (r) => r.applicationNumber },
        { label: 'Status', accessor: (r) => r.currentStatus },
        { label: 'Type', accessor: (r) => r.applicationType },
        { label: 'Purpose', accessor: (r) => r.purpose },
        { label: 'Business Name', accessor: (r) => r.stakeholder?.businessName || '' },
        { label: 'Trade License', accessor: (r) => r.stakeholder?.tradeLicenseNumber || '' },
        { label: 'District', accessor: (r) => r.verificationLocation?.district || '' },
        { label: 'State', accessor: (r) => r.verificationLocation?.state || '' },
        { label: 'Instrument ID', accessor: (r) => r.instrument?.instrumentId || '' },
        { label: 'Category', accessor: (r) => r.instrument?.category || '' },
        { label: 'Serial Number', accessor: (r) => r.instrument?.serialNumber || '' },
        { label: 'Fee Amount (INR)', accessor: (r) => r.feeDetails?.amount || 0 },
        { label: 'Payment Status', accessor: (r) => r.feeDetails?.paymentStatus || '' },
        { label: 'Assigned Officer', accessor: (r) => r.assignedLMO?.name || 'Unassigned' },
        { label: 'Application Date', accessor: (r) => (r.createdAt ? r.createdAt.toISOString() : '') },
      ];
      const csvData = toCsv(headers, apps);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="doca_verification_summary_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }

    return ApiResponse.success(res, apps, 'Verification summary exported in JSON');
  }

  if (reportType === 'revenue') {
    const apps = await VerificationApplication.find()
      .populate('stakeholder', 'businessName')
      .populate('instrument', 'category')
      .sort({ createdAt: -1 })
      .limit(1000);

    if (format === 'csv') {
      const headers = [
        { label: 'Application Number', accessor: (r) => r.applicationNumber },
        { label: 'Business Name', accessor: (r) => r.stakeholder?.businessName || '' },
        { label: 'Category', accessor: (r) => r.instrument?.category || '' },
        { label: 'District', accessor: (r) => r.verificationLocation?.district || '' },
        { label: 'Fee Amount', accessor: (r) => r.feeDetails?.amount || 0 },
        { label: 'Payment Status', accessor: (r) => r.feeDetails?.paymentStatus || '' },
        { label: 'Payment Date', accessor: (r) => (r.feeDetails?.paidAt ? r.feeDetails.paidAt.toISOString() : '') },
        { label: 'Transaction Ref', accessor: (r) => r.feeDetails?.transactionReference || '' },
      ];
      const csvData = toCsv(headers, apps);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="doca_revenue_report_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }

    return ApiResponse.success(res, apps, 'Revenue report exported in JSON');
  }

  if (reportType === 'compliance') {
    const instruments = await Instrument.find()
      .populate('stakeholder', 'businessName tradeLicenseNumber')
      .sort({ createdAt: -1 })
      .limit(1000);

    if (format === 'csv') {
      const headers = [
        { label: 'Instrument ID', accessor: (i) => i.instrumentId },
        { label: 'Category', accessor: (i) => i.category },
        { label: 'Manufacturer', accessor: (i) => i.manufacturer || '' },
        { label: 'Model Number', accessor: (i) => i.modelNumber || '' },
        { label: 'Serial Number', accessor: (i) => i.serialNumber || '' },
        { label: 'Accuracy Class', accessor: (i) => i.accuracyClass || '' },
        { label: 'Status', accessor: (i) => i.status },
        { label: 'Due Date', accessor: (i) => (i.nextVerificationDueDate ? i.nextVerificationDueDate.toISOString() : '') },
        { label: 'Business Name', accessor: (i) => i.stakeholder?.businessName || '' },
      ];
      const csvData = toCsv(headers, instruments);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="doca_instrument_compliance_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }

    return ApiResponse.success(res, instruments, 'Compliance report exported in JSON');
  }

  if (reportType === 'audit-logs') {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(1000);

    if (format === 'csv') {
      const headers = [
        { label: 'Timestamp', accessor: (l) => (l.timestamp ? l.timestamp.toISOString() : '') },
        { label: 'User Email', accessor: (l) => l.userEmail || '' },
        { label: 'Action', accessor: (l) => l.action },
        { label: 'Entity', accessor: (l) => l.entity },
        { label: 'Entity ID', accessor: (l) => l.entityId || '' },
        { label: 'IP Address', accessor: (l) => l.ipAddress || '' },
        { label: 'Details', accessor: (l) => JSON.stringify(l.details || {}) },
      ];
      const csvData = toCsv(headers, logs);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="doca_audit_logs_${Date.now()}.csv"`
      );
      return res.status(200).send(csvData);
    }

    return ApiResponse.success(res, logs, 'Audit logs exported in JSON');
  }

  return ApiResponse.error(res, 'Invalid reportType specified for export', 400);
});
