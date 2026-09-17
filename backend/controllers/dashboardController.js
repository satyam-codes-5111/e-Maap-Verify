import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { Certificate } from '../models/Certificate.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  INSTRUMENT_STATUSES,
  CERTIFICATE_STATUSES,
} from '../config/constants.js';

/**
 * @desc    Get dynamic Admin Dashboard analytics from MongoDB
 * @route   GET /api/dashboard/admin
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const { startDate, endDate, district } = req.query;
  const appFilter = {};
  if (startDate && endDate) {
    appFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  if (district) {
    appFilter['verificationLocation.district'] = new RegExp(district, 'i');
  }

  // Active/valid certificate query helper
  const validCertCondition = {
    $or: [
      { certificateStatus: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
      { status: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
    ],
    validUntil: { $gte: now },
  };

  const expiredCertCondition = {
    $or: [
      { certificateStatus: CERTIFICATE_STATUSES.EXPIRED },
      { status: CERTIFICATE_STATUSES.EXPIRED },
      { validUntil: { $lt: now } },
    ],
  };

  const revokedCertCondition = {
    $or: [
      { certificateStatus: { $in: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED] } },
      { status: { $in: [CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.CANCELLED] } },
    ],
  };

  // Parallel database aggregation queries
  const [
    totalUsers,
    totalStakeholders,
    totalOfficers,
    totalInstruments,
    verifiedInstruments,
    totalApplications,
    pendingApplications,
    scheduledApplications,
    completedApplications,
    rejectedApplications,
    totalCertificates,
    validCertificates,
    expiringCertificates30,
    expiringCertificates7,
    expiringCertificates15,
    expiringCertificates60,
    expiredCertificates,
    revokedCertificates,
    feeStatsAgg,
    resultsStatsAgg,
    applicationsByStatusAgg,
    applicationsByTypeAgg,
    instrumentsByCategoryAgg,
    instrumentsByAccuracyClassAgg,
    officerWorkloadAgg,
    districtDistributionAgg,
    recentApplications,
    recentCertificates,
    recentAuditLogs,
  ] = await Promise.all([
    User.countDocuments(),
    Stakeholder.countDocuments(),
    User.countDocuments({
      role: {
        $in: [
          USER_ROLES.LEGAL_METROLOGY_OFFICER,
          USER_ROLES.FIELD_VERIFICATION_OFFICER,
          USER_ROLES.GATC_OFFICER,
        ],
      },
    }),
    Instrument.countDocuments(),
    Instrument.countDocuments({ status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED }),
    VerificationApplication.countDocuments(appFilter),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: {
        $in: [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW],
      },
    }),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: APPLICATION_STATUSES.SCHEDULED,
    }),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: {
        $in: [
          APPLICATION_STATUSES.VERIFIED,
          APPLICATION_STATUSES.CERTIFICATE_GENERATED,
          APPLICATION_STATUSES.COMPLETED,
        ],
      },
    }),
    VerificationApplication.countDocuments({
      ...appFilter,
      currentStatus: APPLICATION_STATUSES.REJECTED,
    }),
    Certificate.countDocuments(),
    Certificate.countDocuments(validCertCondition),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in30Days },
    }),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in7Days },
    }),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in15Days },
    }),
    Certificate.countDocuments({
      ...validCertCondition,
      validUntil: { $gte: now, $lte: in60Days },
    }),
    Certificate.countDocuments(expiredCertCondition),
    Certificate.countDocuments(revokedCertCondition),

    // Real fee aggregation
    VerificationApplication.aggregate([
      { $match: appFilter },
      {
        $group: {
          _id: null,
          totalAssessedFees: { $sum: '$feeDetails.amount' },
          totalCollectedFees: {
            $sum: {
              $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PAID'] }, '$feeDetails.amount', 0],
            },
          },
          pendingFees: {
            $sum: {
              $cond: [{ $eq: ['$feeDetails.paymentStatus', 'PENDING'] }, '$feeDetails.amount', 0],
            },
          },
        },
      },
    ]),

    // Real verification result stats
    VerificationResult.aggregate([
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          passedCount: {
            $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$result', 'FAIL'] }, 1, 0] },
          },
        },
      },
    ]),

    // Real MongoDB aggregation: Applications breakdown by status
    VerificationApplication.aggregate([
      { $match: appFilter },
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),

    // Real MongoDB aggregation: Applications breakdown by type
    VerificationApplication.aggregate([
      { $match: appFilter },
      { $group: { _id: '$applicationType', count: { $sum: 1 } } },
      { $project: { applicationType: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),

    // Real MongoDB aggregation: Instruments breakdown by category
    Instrument.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),

    // Real MongoDB aggregation: Instruments breakdown by accuracy class
    Instrument.aggregate([
      { $match: { accuracyClass: { $ne: null } } },
      { $group: { _id: '$accuracyClass', count: { $sum: 1 } } },
      { $project: { accuracyClass: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),

    // Real MongoDB aggregation: Officer assignment workload
    VerificationSchedule.aggregate([
      { $match: { status: { $in: ['SCHEDULED', 'RESCHEDULED', 'COMPLETED'] } } },
      {
        $group: {
          _id: '$assignedOfficer',
          scheduledInspections: {
            $sum: { $cond: [{ $in: ['$status', ['SCHEDULED', 'RESCHEDULED']] }, 1, 0] },
          },
          completedInspections: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'officer',
        },
      },
      { $unwind: '$officer' },
      {
        $project: {
          officerId: '$_id',
          officerName: '$officer.name',
          email: '$officer.email',
          designation: '$officer.designation',
          scheduledInspections: 1,
          completedInspections: 1,
          _id: 0,
        },
      },
      { $sort: { scheduledInspections: -1 } },
    ]),

    // Real MongoDB aggregation: District distribution
    VerificationApplication.aggregate([
      { $match: appFilter },
      { $match: { 'verificationLocation.district': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$verificationLocation.district',
          applicationCount: { $sum: 1 },
        },
      },
      { $project: { district: '$_id', applicationCount: 1, _id: 0 } },
      { $sort: { applicationCount: -1 } },
    ]),

    // Recent 5 applications
    VerificationApplication.find(appFilter)
      .populate('stakeholder', 'businessName tradeLicenseNumber')
      .populate('instrument', 'instrumentId category instrumentType serialNumber')
      .populate('assignedLMO', 'name designation')
      .sort({ createdAt: -1 })
      .limit(5),

    // Recent 5 certificates
    Certificate.find()
      .populate('stakeholder', 'businessName')
      .populate('instrument', 'instrumentId category modelNumber serialNumber')
      .populate('issuedBy', 'name designation')
      .sort({ createdAt: -1 })
      .limit(5),

    // Recent 5 audit logs
    AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(5),
  ]);

  const feeStats = feeStatsAgg[0] || {
    totalAssessedFees: 0,
    totalCollectedFees: 0,
    pendingFees: 0,
  };

  const resultStats = resultsStatsAgg[0] || {
    totalResults: 0,
    passedCount: 0,
    failedCount: 0,
  };

  const passRate =
    resultStats.totalResults > 0
      ? Number(((resultStats.passedCount / resultStats.totalResults) * 100).toFixed(1))
      : 0;

  return ApiResponse.success(
    res,
    {
      counts: {
        totalUsers,
        totalStakeholders,
        totalOfficers,
        totalInstruments,
        verifiedInstruments,
        totalApplications,
        pendingApplications,
        scheduledApplications,
        completedApplications,
        rejectedApplications,
        totalCertificates,
        validCertificates,
        expiringCertificates: expiringCertificates30,
        expiring7Days: expiringCertificates7,
        expiring15Days: expiringCertificates15,
        expiring30Days: expiringCertificates30,
        expiring60Days: expiringCertificates60,
        expiredCertificates,
        revokedCertificates,
        totalAssessedFees: feeStats.totalAssessedFees,
        totalCollectedFees: feeStats.totalCollectedFees,
        pendingFees: feeStats.pendingFees,
      },
      applicationsByStatus: applicationsByStatusAgg,
      applicationsByType: applicationsByTypeAgg,
      instrumentsByCategory: instrumentsByCategoryAgg,
      instrumentsByAccuracyClass: instrumentsByAccuracyClassAgg,
      officerWorkload: officerWorkloadAgg,
      districtDistribution: districtDistributionAgg,
      resultsSummary: {
        totalResults: resultStats.totalResults,
        passedCount: resultStats.passedCount,
        failedCount: resultStats.failedCount,
        passRate,
      },
      recentApplications,
      recentCertificates,
      recentAuditLogs,
    },
    'Admin dashboard metrics generated dynamically from MongoDB'
  );
});

/**
 * @desc    Get dynamic LMO / Field Officer Dashboard metrics from MongoDB
 * @route   GET /api/dashboard/officer
 * @access  Private (LEGAL_METROLOGY_OFFICER, FIELD_VERIFICATION_OFFICER, GATC_OFFICER, ADMIN, SUPER_ADMIN)
 */
export const getOfficerDashboard = asyncHandler(async (req, res) => {
  let officerId = req.user._id;

  // If Admin / Super Admin requests another officer's dashboard
  if (
    [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(req.user.role) &&
    req.query.officerId
  ) {
    officerId = req.query.officerId;
  }

  const officer = await User.findById(officerId).select(
    'name email designation role jurisdiction phone'
  );

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    assignedTotal,
    assignedPendingReview,
    assignedScheduled,
    assignedPendingInspection,
    completedInspections,
    passedCount,
    failedCount,
    todaySchedules,
    upcomingSchedules,
    recentInspections,
    testedByCategoryAgg,
  ] = await Promise.all([
    // Total assigned applications
    VerificationApplication.countDocuments({ assignedLMO: officerId }),

    // Applications pending scrutiny/review
    VerificationApplication.countDocuments({
      assignedLMO: officerId,
      currentStatus: {
        $in: [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW],
      },
    }),

    // Applications in scheduled status
    VerificationApplication.countDocuments({
      assignedLMO: officerId,
      currentStatus: APPLICATION_STATUSES.SCHEDULED,
    }),

    // In-progress inspections
    VerificationApplication.countDocuments({
      assignedLMO: officerId,
      currentStatus: {
        $in: [APPLICATION_STATUSES.SCHEDULED, APPLICATION_STATUSES.INSPECTION],
      },
    }),

    // Completed inspection results by this officer
    VerificationResult.countDocuments({ verifiedBy: officerId }),

    // Passed inspection results
    VerificationResult.countDocuments({ verifiedBy: officerId, result: 'PASS' }),

    // Failed inspection results
    VerificationResult.countDocuments({ verifiedBy: officerId, result: 'FAIL' }),

    // Schedules for today
    VerificationSchedule.find({
      assignedOfficer: officerId,
      status: { $in: ['SCHEDULED', 'RESCHEDULED'] },
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate({
        path: 'application',
        populate: [{ path: 'instrument' }, { path: 'stakeholder' }],
      })
      .sort({ scheduledDate: 1 }),

    // Upcoming schedules (next 7 days)
    VerificationSchedule.find({
      assignedOfficer: officerId,
      status: { $in: ['SCHEDULED', 'RESCHEDULED'] },
      scheduledDate: { $gte: startOfDay, $lte: in7Days },
    })
      .populate({
        path: 'application',
        populate: [{ path: 'instrument' }, { path: 'stakeholder' }],
      })
      .sort({ scheduledDate: 1 })
      .limit(10),

    // Recent results recorded
    VerificationResult.find({ verifiedBy: officerId })
      .populate('instrument', 'instrumentId category manufacturer modelNumber serialNumber')
      .populate('application', 'applicationNumber purpose')
      .sort({ verificationDate: -1 })
      .limit(5),

    // Aggregated instruments tested by category
    VerificationResult.aggregate([
      { $match: { verifiedBy: officerId } },
      {
        $lookup: {
          from: 'instruments',
          localField: 'instrument',
          foreignField: '_id',
          as: 'instrumentData',
        },
      },
      { $unwind: '$instrumentData' },
      {
        $group: {
          _id: '$instrumentData.category',
          count: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] } },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          passed: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const totalResults = passedCount + failedCount;
  const passRate =
    totalResults > 0 ? Number(((passedCount / totalResults) * 100).toFixed(1)) : 0;

  return ApiResponse.success(
    res,
    {
      officer: officer || {
        _id: officerId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      counts: {
        assignedTotal,
        assignedPendingReview,
        assignedScheduled,
        assignedPendingInspection,
        completedInspections,
        passedCount,
        failedCount,
        passRate,
      },
      assignedTotal,
      assignedPendingInspection,
      completedInspections,
      todaySchedules,
      upcomingSchedules,
      recentInspections,
      testedByCategory: testedByCategoryAgg,
    },
    'Officer metrics generated dynamically from MongoDB'
  );
});

/**
 * @desc    Get dynamic Stakeholder Dashboard metrics from MongoDB
 * @route   GET /api/dashboard/stakeholder
 * @access  Private (BUSINESS_USER)
 */
export const getStakeholderDashboard = asyncHandler(async (req, res) => {
  let stakeholder = await Stakeholder.findOne({ user: req.user._id });
  if (!stakeholder && req.user.stakeholderId) {
    stakeholder = await Stakeholder.findById(req.user.stakeholderId);
  }

  if (!stakeholder) {
    return ApiResponse.success(res, {
      stakeholder: null,
      counts: {
        totalInstruments: 0,
        activeVerifiedInstruments: 0,
        pendingVerificationInstruments: 0,
        overdueInstruments: 0,
        expiringWithin7Days: 0,
        expiringWithin15Days: 0,
        expiringWithin30Days: 0,
        expiringWithin60Days: 0,
        totalApplications: 0,
        pendingApplications: 0,
        completedApplications: 0,
        rejectedApplications: 0,
        totalCertificates: 0,
        activeCertificates: 0,
        expiredCertificates: 0,
      },
      complianceAlerts: [],
      recentApplications: [],
      recentCertificates: [],
      upcomingSchedules: [],
    });
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [
    totalInstruments,
    activeVerifiedInstruments,
    pendingVerificationInstruments,
    overdueInstruments,
    expiring7Days,
    expiring15Days,
    expiring30Days,
    expiring60Days,
    totalApplications,
    pendingApplications,
    completedApplications,
    rejectedApplications,
    totalCertificates,
    activeCertificates,
    expiredCertificates,
    recentApplications,
    recentCertificates,
    upcomingSchedules,
  ] = await Promise.all([
    Instrument.countDocuments({ stakeholder: stakeholder._id }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      status: {
        $in: [
          INSTRUMENT_STATUSES.REGISTERED_UNVERIFIED,
          INSTRUMENT_STATUSES.PENDING_VERIFICATION,
        ],
      },
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $lt: now },
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in7Days },
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in15Days },
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in30Days },
    }),
    Instrument.countDocuments({
      stakeholder: stakeholder._id,
      nextVerificationDueDate: { $gte: now, $lte: in60Days },
    }),
    VerificationApplication.countDocuments({ stakeholder: stakeholder._id }),
    VerificationApplication.countDocuments({
      stakeholder: stakeholder._id,
      currentStatus: {
        $in: [
          APPLICATION_STATUSES.SUBMITTED,
          APPLICATION_STATUSES.UNDER_REVIEW,
          APPLICATION_STATUSES.SCHEDULED,
          APPLICATION_STATUSES.INSPECTION,
        ],
      },
    }),
    VerificationApplication.countDocuments({
      stakeholder: stakeholder._id,
      currentStatus: {
        $in: [
          APPLICATION_STATUSES.VERIFIED,
          APPLICATION_STATUSES.CERTIFICATE_GENERATED,
          APPLICATION_STATUSES.COMPLETED,
        ],
      },
    }),
    VerificationApplication.countDocuments({
      stakeholder: stakeholder._id,
      currentStatus: APPLICATION_STATUSES.REJECTED,
    }),
    Certificate.countDocuments({ stakeholder: stakeholder._id }),
    Certificate.countDocuments({
      stakeholder: stakeholder._id,
      $or: [
        { certificateStatus: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
        { status: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
      ],
      validUntil: { $gte: now },
    }),
    Certificate.countDocuments({
      stakeholder: stakeholder._id,
      $or: [
        { certificateStatus: CERTIFICATE_STATUSES.EXPIRED },
        { status: CERTIFICATE_STATUSES.EXPIRED },
        { validUntil: { $lt: now } },
      ],
    }),
    VerificationApplication.find({ stakeholder: stakeholder._id })
      .populate('instrument', 'instrumentId category instrumentType serialNumber')
      .sort({ createdAt: -1 })
      .limit(5),
    Certificate.find({ stakeholder: stakeholder._id })
      .populate('instrument', 'instrumentId category modelNumber serialNumber')
      .sort({ issuedAt: -1 })
      .limit(5),
    VerificationSchedule.find({
      status: { $in: ['SCHEDULED', 'RESCHEDULED'] },
      scheduledDate: { $gte: now },
    })
      .populate({
        path: 'application',
        match: { stakeholder: stakeholder._id },
        populate: { path: 'instrument', select: 'instrumentId category' },
      })
      .populate('assignedOfficer', 'name designation phone')
      .sort({ scheduledDate: 1 })
      .limit(5),
  ]);

  // Filter out schedules where application was not matched
  const filteredSchedules = upcomingSchedules.filter((s) => s.application);

  // Generate dynamic statutory compliance alerts
  const complianceAlerts = [];
  if (overdueInstruments > 0) {
    complianceAlerts.push({
      severity: 'CRITICAL',
      code: 'STATUTORY_REVERIFICATION_OVERDUE',
      message: `${overdueInstruments} weighing/measuring instrument(s) have passed statutory due date. Under Legal Metrology Act 2009 (Sec 24), unverified commercial instruments are subject to immediate seizure.`,
      actionRequired: 'Submit Reverification Application immediately.',
    });
  }
  if (expiring30Days > 0) {
    complianceAlerts.push({
      severity: 'WARNING',
      code: 'EXPIRING_WITHIN_30_DAYS',
      message: `${expiring30Days} instrument(s) will expire within 30 days. File reverification now to avoid business disruption.`,
      actionRequired: 'Schedule Reverification Inspection.',
    });
  }
  if (stakeholder.kycStatus === 'PENDING') {
    complianceAlerts.push({
      severity: 'INFO',
      code: 'KYC_SCRUTINY_PENDING',
      message: 'Business KYC documents are currently under scrutiny by the District Controller.',
      actionRequired: 'Ensure GST & Trade License copies are clear.',
    });
  }

  return ApiResponse.success(
    res,
    {
      stakeholder: {
        _id: stakeholder._id,
        businessName: stakeholder.businessName,
        tradeLicenseNumber: stakeholder.tradeLicenseNumber,
        gstNumber: stakeholder.gstNumber,
        businessType: stakeholder.businessType,
        kycStatus: stakeholder.kycStatus,
        registeredAddress: stakeholder.registeredAddress,
      },
      counts: {
        totalInstruments,
        activeVerifiedInstruments,
        pendingVerificationInstruments,
        overdueInstruments,
        expiringWithin7Days: expiring7Days,
        expiringWithin15Days: expiring15Days,
        expiringWithin30Days: expiring30Days,
        expiringWithin60Days: expiring60Days,
        totalApplications,
        pendingApplications,
        completedApplications,
        rejectedApplications,
        totalCertificates,
        activeCertificates,
        expiredCertificates,
      },
      totalInstruments,
      activeCertificates,
      pendingApplications,
      expiringWithin30Days: expiring30Days,
      complianceAlerts,
      recentApplications,
      recentCertificates,
      upcomingSchedules: filteredSchedules,
    },
    'Stakeholder dashboard metrics generated dynamically from MongoDB'
  );
});
