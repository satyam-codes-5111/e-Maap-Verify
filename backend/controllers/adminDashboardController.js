import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get dynamic Admin Dashboard summary with live MongoDB calculated KPIs
 * @route   GET /api/admin/dashboard/summary
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
export const getAdminDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Execute all dynamic aggregations and counts in parallel against real MongoDB records
  const [
    totalStakeholders,
    totalInstruments,
    totalApplications,
    pendingApplications,
    approvedApplications,
    scheduledVerifications,
    inspectionsInProgress,
    completedInspections,
    verifiedInstruments,
    rejectedOrFailedInspections,
    activeCertificates,
    expiringCertificates,
    expiredCertificates,
    overdueInstruments,
    todaySchedules,
    recentApplications,
    recentActivity,
    applicationStatusAggregation,
  ] = await Promise.all([
    // 1. Total stakeholders
    Stakeholder.countDocuments(),

    // 2. Total instruments
    Instrument.countDocuments(),

    // 3. Total applications
    VerificationApplication.countDocuments(),

    // 4. Pending applications (SUBMITTED, UNDER_REVIEW)
    VerificationApplication.countDocuments({
      currentStatus: { $in: ['SUBMITTED', 'UNDER_REVIEW'] },
    }),

    // 5. Approved applications
    VerificationApplication.countDocuments({
      currentStatus: 'APPROVED',
    }),

    // 6. Scheduled verifications
    VerificationSchedule.countDocuments({
      status: { $in: ['SCHEDULED', 'CONFIRMED'] },
    }),

    // 7. Inspections in progress
    VerificationInspection.countDocuments({
      inspectionStatus: { $in: ['IN_PROGRESS', 'SCHEDULED', 'SUBMITTED', 'DRAFT'] },
    }),

    // 8. Completed inspections
    VerificationInspection.countDocuments({
      inspectionStatus: { $in: ['PASSED', 'FAILED', 'COMPLETED'] },
    }),

    // 9. Verified instruments
    Instrument.countDocuments({
      status: { $in: ['ACTIVE_VERIFIED', 'VERIFIED'] },
    }),

    // 10. Rejected/failed inspections
    VerificationInspection.countDocuments({
      $or: [
        { result: { $in: ['REJECTED', 'FAILED'] } },
        { inspectionStatus: 'FAILED' },
      ],
    }),

    // 11. Active certificates (ACTIVE/VALID and validUntil >= now)
    Certificate.countDocuments({
      status: { $in: ['ACTIVE', 'VALID'] },
      validUntil: { $gte: now },
    }),

    // 12. Expiring certificates (validUntil between now and 30 days)
    Certificate.countDocuments({
      status: { $in: ['ACTIVE', 'VALID'] },
      validUntil: { $gte: now, $lte: thirtyDaysFromNow },
    }),

    // 13. Expired certificates
    Certificate.countDocuments({
      $or: [
        { status: 'EXPIRED' },
        { certificateStatus: 'EXPIRED' },
        { validUntil: { $lt: now } },
      ],
    }),

    // 14. Overdue instruments
    Instrument.countDocuments({
      nextVerificationDueDate: { $lt: now },
      status: { $ne: 'DECOMMISSIONED' },
    }),

    // 15. Today's schedules
    VerificationSchedule.countDocuments({
      scheduledDate: { $gte: startOfToday, $lte: endOfToday },
    }),

    // Recent applications feed
    VerificationApplication.find()
      .populate('stakeholder', 'legalName businessName tradeName')
      .populate('instrument', 'instrumentType category manufacturer modelNumber serialNumber')
      .populate('assignedLMO', 'name email designation')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    // Recent activity audit feed
    AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .lean(),

    // Application status aggregation breakdown
    VerificationApplication.aggregate([
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]),
  ]);

  const summary = {
    // Top-level KPI counts for immediate dashboard access
    totalStakeholders,
    totalInstruments,
    totalApplications,
    pendingApplications,
    approvedApplications,
    scheduledVerifications,
    inspectionsInProgress,
    completedInspections,
    verifiedInstruments,
    rejectedOrFailedInspections,
    activeCertificates,
    expiringCertificates,
    expiredCertificates,
    overdueInstruments,
    todaySchedules,

    // Structured KPI block
    kpis: {
      totalStakeholders,
      totalInstruments,
      totalApplications,
      pendingApplications,
      approvedApplications,
      scheduledVerifications,
      inspectionsInProgress,
      completedInspections,
      verifiedInstruments,
      rejectedOrFailedInspections,
      activeCertificates,
      expiringCertificates,
      expiredCertificates,
      overdueInstruments,
      todaySchedules,
    },

    // Auxiliary widgets for dashboard UI
    recentApplications,
    recentActivity,
    applicationStatusBreakdown: applicationStatusAggregation,
  };

  return ApiResponse.success(res, summary, 'Admin dashboard summary calculated successfully from MongoDB');
});
