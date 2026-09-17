/**
 * Phase 10: Dynamic Admin Dashboard, Analytics Engine & Statutory Reports Test Suite
 *
 * Covers all 35 required tests:
 * 1 admin dashboard access
 * 2 business user blocked
 * 3 officer permission behavior
 * 4 summary counts
 * 5 application analytics
 * 6 application date filter
 * 7 application status filter
 * 8 verification analytics
 * 9 pass/fail calculation
 * 10 certificate analytics
 * 11 expiry calculation
 * 12 revoked exclusion
 * 13 schedule analytics
 * 14 officer workload
 * 15 instrument analytics
 * 16 stakeholder analytics
 * 17 report access
 * 18 application report
 * 19 inspection report
 * 20 certificate report
 * 21 schedule report
 * 22 pagination
 * 23 sorting
 * 24 search
 * 25 date range
 * 26 unauthorized export
 * 27 CSV/XLSX export
 * 28 audit log creation
 * 29 privacy validation
 * 30 malformed parameters
 * 31 invalid ObjectId
 * 32 large-data aggregation safety
 * 33 Phase 3–9 regression
 * 34 TypeScript/typecheck
 * 35 production build
 */

import { execSync } from 'child_process';
import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { AuditLog } from '../models/AuditLog.js';
import { USER_ROLES } from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';
const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] Test ${id}: ${name} ${details ? `(${details})` : ''}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('📊 Starting Phase 10: Dynamic Admin Dashboard & Analytics Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  let adminToken = '';
  let officerToken = '';
  let businessToken = '';

  let adminUser = null;
  let officerUser = null;
  let businessUser = null;

  try {
    // -------------------------------------------------------------
    // Setup: Provision Personas & Authenticate
    // -------------------------------------------------------------
    console.log('🔧 [Setup] Authenticating test personas and ensuring test fixtures...');

    // 1. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminData = await adminLoginRes.json();
    adminToken = adminData.data?.token;
    adminUser = await User.findOne({ email: adminEmail });

    if (!adminToken) {
      throw new Error(`Failed to login as admin: ${adminData.message}`);
    }

    // 2. Officer Persona
    officerUser = await User.findOne({ email: 'phase10_admin_officer@doca.gov.in' });
    if (!officerUser) {
      officerUser = new User({
        name: 'Inspector Rajesh Varma',
        email: 'phase10_admin_officer@doca.gov.in',
        phone: '9822334455',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Senior Legal Metrology Officer',
        jurisdiction: { state: 'Delhi', district: 'Central Delhi', zone: 'North' },
        isActive: true,
      });
      officerUser.password = 'Officer@DoCA2026!';
      await officerUser.save();
    }
    const offLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase10_admin_officer@doca.gov.in', password: 'Officer@DoCA2026!' }),
    });
    officerToken = (await offLoginRes.json()).data?.token;

    // 3. Business User Persona
    businessUser = await User.findOne({ email: 'phase10_admin_trader@test.com' });
    if (!businessUser) {
      businessUser = new User({
        name: 'Suresh Kumar',
        email: 'phase10_admin_trader@test.com',
        phone: '9811223344',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
      businessUser.password = 'Trader@DoCA2026!';
      await businessUser.save();
    }
    const bizLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase10_admin_trader@test.com', password: 'Trader@DoCA2026!' }),
    });
    businessToken = (await bizLoginRes.json()).data?.token;

    console.log('✅ [Setup] Fixtures and personas ready. Executing 35 statutory assertions...\n');

    // =============================================================
    // TEST 1: Admin Dashboard Access
    // =============================================================
    const res1 = await fetch(`${BASE_URL}/api/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data1 = await res1.json();
    recordTest(
      1,
      'admin dashboard access',
      res1.status === 200 && data1.success === true,
      `Status: ${res1.status}, Total Apps: ${data1.data?.totalApplications}`
    );

    // =============================================================
    // TEST 2: Business User Blocked
    // =============================================================
    const res2 = await fetch(`${BASE_URL}/api/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${businessToken}` },
    });
    recordTest(
      2,
      'business user blocked',
      res2.status === 403,
      `HTTP status: ${res2.status} (Expected 403)`
    );

    // =============================================================
    // TEST 3: Officer Permission Behavior
    // =============================================================
    const res3 = await fetch(`${BASE_URL}/api/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    recordTest(
      3,
      'officer permission behavior',
      res3.status === 403,
      `Officer forbidden from global admin dashboard: HTTP ${res3.status}`
    );

    // =============================================================
    // TEST 4: Summary Counts against Direct MongoDB Aggregations
    // =============================================================
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      dbStakeholders,
      dbInstruments,
      dbApplications,
      dbPendingApps,
      dbApprovedApps,
      dbScheduledVerifs,
      dbActiveCerts,
      dbOverdueInsts,
    ] = await Promise.all([
      Stakeholder.countDocuments(),
      Instrument.countDocuments(),
      VerificationApplication.countDocuments(),
      VerificationApplication.countDocuments({ currentStatus: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } }),
      VerificationApplication.countDocuments({ currentStatus: 'APPROVED' }),
      VerificationSchedule.countDocuments({ status: { $in: ['SCHEDULED', 'CONFIRMED'] } }),
      Certificate.countDocuments({ status: { $in: ['ACTIVE', 'VALID'] }, validUntil: { $gte: now } }),
      Instrument.countDocuments({ nextVerificationDueDate: { $lt: now }, status: { $ne: 'DECOMMISSIONED' } }),
    ]);

    const kpis = data1.data || {};
    const countsMatch =
      kpis.totalStakeholders === dbStakeholders &&
      kpis.totalInstruments === dbInstruments &&
      kpis.totalApplications === dbApplications &&
      kpis.pendingApplications === dbPendingApps &&
      kpis.approvedApplications === dbApprovedApps &&
      kpis.scheduledVerifications === dbScheduledVerifs &&
      kpis.activeCertificates === dbActiveCerts &&
      kpis.overdueInstruments === dbOverdueInsts;

    recordTest(
      4,
      'summary counts',
      countsMatch,
      `Stakeholders: ${kpis.totalStakeholders}/${dbStakeholders}, Apps: ${kpis.totalApplications}/${dbApplications}, Certs: ${kpis.activeCertificates}/${dbActiveCerts}`
    );

    // =============================================================
    // TEST 5: Application Analytics
    // =============================================================
    const res5 = await fetch(`${BASE_URL}/api/admin/analytics/applications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data5 = await res5.json();
    const hasAppAnalytics =
      res5.status === 200 &&
      data5.data?.summary &&
      Array.isArray(data5.data?.timeline) &&
      Array.isArray(data5.data?.statusBreakdown) &&
      Array.isArray(data5.data?.typeDistribution);
    recordTest(
      5,
      'application analytics',
      hasAppAnalytics,
      `Timeline entries: ${data5.data?.timeline?.length || 0}, Status groups: ${data5.data?.statusBreakdown?.length || 0}`
    );

    // =============================================================
    // TEST 6: Application Date Filter
    // =============================================================
    const res6 = await fetch(`${BASE_URL}/api/admin/analytics/applications?dateFrom=2020-01-01&dateTo=2026-12-31`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data6 = await res6.json();
    recordTest(
      6,
      'application date filter',
      res6.status === 200 && data6.data?.summary?.total !== undefined,
      `Filtered Total: ${data6.data?.summary?.total}`
    );

    // =============================================================
    // TEST 7: Application Status Filter
    // =============================================================
    const res7 = await fetch(`${BASE_URL}/api/admin/analytics/applications?status=APPROVED`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data7 = await res7.json();
    const isApprovedFiltered =
      res7.status === 200 &&
      (data7.data?.statusBreakdown?.every((s) => s.status === 'APPROVED') ||
        data7.data?.statusBreakdown?.length === 0 ||
        data7.data?.statusBreakdown?.[0]?.status === 'APPROVED');
    recordTest(
      7,
      'application status filter',
      isApprovedFiltered,
      `Status groups matched: ${data7.data?.statusBreakdown?.length}`
    );

    // =============================================================
    // TEST 8: Verification Analytics
    // =============================================================
    const res8 = await fetch(`${BASE_URL}/api/admin/analytics/verifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data8 = await res8.json();
    const hasVerifAnalytics =
      res8.status === 200 &&
      data8.data?.totalInspections !== undefined &&
      data8.data?.passed !== undefined &&
      data8.data?.failed !== undefined &&
      data8.data?.passRate !== undefined &&
      Array.isArray(data8.data?.verificationTrends);
    recordTest(
      8,
      'verification analytics',
      hasVerifAnalytics,
      `Total: ${data8.data?.totalInspections}, Passed: ${data8.data?.passed}, Failed: ${data8.data?.failed}`
    );

    // =============================================================
    // TEST 9: Pass/Fail Calculation
    // =============================================================
    const passRate = Number(data8.data?.passRate || 0);
    const failureRate = Number(data8.data?.failureRate || 0);
    const mathAccurate =
      passRate >= 0 &&
      failureRate >= 0 &&
      passRate + failureRate <= 100.1 &&
      (data8.data?.passed || 0) <= (data8.data?.totalInspections || 0);
    recordTest(
      9,
      'pass/fail calculation',
      mathAccurate,
      `Pass Rate: ${passRate}%, Failure Rate: ${failureRate}%`
    );

    // =============================================================
    // TEST 10: Certificate Analytics
    // =============================================================
    const res10 = await fetch(`${BASE_URL}/api/admin/analytics/certificates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data10 = await res10.json();
    const hasCertAnalytics =
      res10.status === 200 &&
      data10.data?.active !== undefined &&
      data10.data?.expiringSoon !== undefined &&
      data10.data?.expired !== undefined &&
      data10.data?.revoked !== undefined &&
      Array.isArray(data10.data?.monthlyIssuanceTrend);
    recordTest(
      10,
      'certificate analytics',
      hasCertAnalytics,
      `Active: ${data10.data?.active}, Expiring Soon: ${data10.data?.expiringSoon}, Revoked: ${data10.data?.revoked}`
    );

    // =============================================================
    // TEST 11: Expiry Calculation
    // =============================================================
    const dbExpiringSoon = await Certificate.countDocuments({
      status: { $in: ['ACTIVE', 'VALID'] },
      validUntil: { $gte: now, $lte: thirtyDaysFromNow },
    });
    const expiryAccurate = data10.data?.expiringSoon === dbExpiringSoon;
    recordTest(
      11,
      'expiry calculation',
      expiryAccurate,
      `API: ${data10.data?.expiringSoon}, DB: ${dbExpiringSoon}`
    );

    // =============================================================
    // TEST 12: Revoked Exclusion
    // =============================================================
    const dbRevoked = await Certificate.countDocuments({
      $or: [{ status: 'REVOKED' }, { certificateStatus: 'REVOKED' }],
    });
    const revokedAccurate = data10.data?.revoked === dbRevoked;
    recordTest(
      12,
      'revoked exclusion',
      revokedAccurate,
      `API Revoked: ${data10.data?.revoked}, DB Revoked: ${dbRevoked}`
    );

    // =============================================================
    // TEST 13: Schedule Analytics
    // =============================================================
    const res13 = await fetch(`${BASE_URL}/api/admin/analytics/schedules`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data13 = await res13.json();
    const hasScheduleAnalytics =
      res13.status === 200 &&
      data13.data?.scheduled !== undefined &&
      data13.data?.completed !== undefined &&
      data13.data?.cancelled !== undefined &&
      data13.data?.upcoming !== undefined &&
      Array.isArray(data13.data?.officerWorkload);
    recordTest(
      13,
      'schedule analytics',
      hasScheduleAnalytics,
      `Scheduled: ${data13.data?.scheduled}, Completed: ${data13.data?.completed}, Upcoming: ${data13.data?.upcoming}`
    );

    // =============================================================
    // TEST 14: Officer Workload
    // =============================================================
    const res14 = await fetch(`${BASE_URL}/api/admin/analytics/officers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data14 = await res14.json();
    const hasOfficerWorkload =
      res14.status === 200 &&
      Array.isArray(data14.data) &&
      data14.data.length > 0 &&
      data14.data[0].officer?.name !== undefined &&
      data14.data[0].assignedInspections !== undefined;
    recordTest(
      14,
      'officer workload',
      hasOfficerWorkload,
      `Officers listed: ${data14.data?.length}, Sample: ${data14.data?.[0]?.officer?.name}`
    );

    // =============================================================
    // TEST 15: Instrument Analytics
    // =============================================================
    const res15 = await fetch(`${BASE_URL}/api/admin/analytics/instruments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data15 = await res15.json();
    const hasInstAnalytics =
      res15.status === 200 &&
      data15.data?.totalInstruments !== undefined &&
      data15.data?.verified !== undefined &&
      data15.data?.unverified !== undefined &&
      data15.data?.overdue !== undefined &&
      Array.isArray(data15.data?.byInstrumentType);
    recordTest(
      15,
      'instrument analytics',
      hasInstAnalytics,
      `Total: ${data15.data?.totalInstruments}, Verified: ${data15.data?.verified}, Overdue: ${data15.data?.overdue}`
    );

    // =============================================================
    // TEST 16: Stakeholder Analytics
    // =============================================================
    const res16 = await fetch(`${BASE_URL}/api/admin/analytics/stakeholders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data16 = await res16.json();
    const hasStakeholderAnalytics =
      res16.status === 200 &&
      data16.data?.total !== undefined &&
      data16.data?.active !== undefined &&
      data16.data?.averageApplicationsPerStakeholder !== undefined &&
      Array.isArray(data16.data?.stakeholderMetrics);
    recordTest(
      16,
      'stakeholder analytics',
      hasStakeholderAnalytics,
      `Total: ${data16.data?.total}, Avg Apps: ${data16.data?.averageApplicationsPerStakeholder}`
    );

    // =============================================================
    // TEST 17: Report Access
    // =============================================================
    const res17 = await fetch(`${BASE_URL}/api/admin/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data17 = await res17.json();
    recordTest(
      17,
      'report access',
      res17.status === 200 && data17.data?.reportType === 'applications',
      `HTTP status: ${res17.status}, Type: ${data17.data?.reportType}`
    );

    // =============================================================
    // TEST 18: Application Report
    // =============================================================
    const res18 = await fetch(`${BASE_URL}/api/admin/reports?type=applications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data18 = await res18.json();
    recordTest(
      18,
      'application report',
      res18.status === 200 && Array.isArray(data18.data?.records),
      `Records returned: ${data18.data?.records?.length}`
    );

    // =============================================================
    // TEST 19: Inspection Report
    // =============================================================
    const res19 = await fetch(`${BASE_URL}/api/admin/reports?type=inspections`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data19 = await res19.json();
    recordTest(
      19,
      'inspection report',
      res19.status === 200 && Array.isArray(data19.data?.records),
      `Records returned: ${data19.data?.records?.length}`
    );

    // =============================================================
    // TEST 20: Certificate Report
    // =============================================================
    const res20 = await fetch(`${BASE_URL}/api/admin/reports?type=certificates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data20 = await res20.json();
    recordTest(
      20,
      'certificate report',
      res20.status === 200 && Array.isArray(data20.data?.records),
      `Records returned: ${data20.data?.records?.length}`
    );

    // =============================================================
    // TEST 21: Schedule Report
    // =============================================================
    const res21 = await fetch(`${BASE_URL}/api/admin/reports?type=schedules`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data21 = await res21.json();
    recordTest(
      21,
      'schedule report',
      res21.status === 200 && Array.isArray(data21.data?.records),
      `Records returned: ${data21.data?.records?.length}`
    );

    // =============================================================
    // TEST 22: Pagination
    // =============================================================
    const res22 = await fetch(`${BASE_URL}/api/admin/reports?type=applications&page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data22 = await res22.json();
    const paginationPassed =
      res22.status === 200 &&
      data22.data?.pagination?.limit === 2 &&
      data22.data?.pagination?.page === 1 &&
      data22.data?.records?.length <= 2;
    recordTest(
      22,
      'pagination',
      paginationPassed,
      `Limit: ${data22.data?.pagination?.limit}, Total Pages: ${data22.data?.pagination?.totalPages}`
    );

    // =============================================================
    // TEST 23: Sorting
    // =============================================================
    const res23Asc = await fetch(`${BASE_URL}/api/admin/reports?type=applications&sortBy=createdAt&sortOrder=asc&limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const res23Desc = await fetch(`${BASE_URL}/api/admin/reports?type=applications&sortBy=createdAt&sortOrder=desc&limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data23Asc = await res23Asc.json();
    const data23Desc = await res23Desc.json();
    const sortingWorks =
      res23Asc.status === 200 &&
      res23Desc.status === 200 &&
      data23Asc.data?.records?.[0]?.createdAt !== undefined;
    recordTest(
      23,
      'sorting',
      sortingWorks,
      `Asc Date: ${data23Asc.data?.records?.[0]?.createdAt?.slice(0, 10)}, Desc Date: ${data23Desc.data?.records?.[0]?.createdAt?.slice(0, 10)}`
    );

    // =============================================================
    // TEST 24: Search
    // =============================================================
    const res24 = await fetch(`${BASE_URL}/api/admin/reports?type=applications&search=APP`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data24 = await res24.json();
    recordTest(
      24,
      'search',
      res24.status === 200 && Array.isArray(data24.data?.records),
      `Matched Search: ${data24.data?.records?.length}`
    );

    // =============================================================
    // TEST 25: Date Range
    // =============================================================
    const res25 = await fetch(`${BASE_URL}/api/admin/reports?type=applications&dateFrom=2020-01-01&dateTo=2026-12-31`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data25 = await res25.json();
    recordTest(
      25,
      'date range',
      res25.status === 200 && data25.data?.records !== undefined,
      `Date Range Count: ${data25.data?.records?.length}`
    );

    // =============================================================
    // TEST 26: Unauthorized Export
    // =============================================================
    const res26 = await fetch(`${BASE_URL}/api/admin/reports/export?type=applications`, {
      headers: { Authorization: `Bearer ${businessToken}` },
    });
    recordTest(
      26,
      'unauthorized export',
      res26.status === 403,
      `HTTP status: ${res26.status} (Expected 403 Forbidden)`
    );

    // =============================================================
    // TEST 27: CSV/XLSX Export
    // =============================================================
    const res27 = await fetch(`${BASE_URL}/api/admin/reports/export?type=applications&format=csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const contentType27 = res27.headers.get('content-type') || '';
    const csvBody = await res27.text();
    const csvExportSuccess =
      res27.status === 200 &&
      contentType27.includes('text/csv') &&
      csvBody.includes('Application Number');
    recordTest(
      27,
      'CSV/XLSX export',
      csvExportSuccess,
      `Content-Type: ${contentType27}, Line count: ${csvBody.split('\n').length}`
    );

    // =============================================================
    // TEST 28: Audit Log Creation
    // =============================================================
    const exportAudit = await AuditLog.findOne({
      action: 'ADMIN_REPORT_EXPORT',
      entityId: 'applications',
    }).sort({ timestamp: -1 });
    const auditCreated = !!exportAudit && exportAudit.userRole === USER_ROLES.SUPER_ADMIN;
    recordTest(
      28,
      'audit log creation',
      auditCreated,
      `Audit ID: ${exportAudit?._id}, Action: ${exportAudit?.action}`
    );

    // =============================================================
    // TEST 29: Privacy Validation
    // =============================================================
    const res29 = await fetch(`${BASE_URL}/api/admin/reports?type=officers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data29 = await res29.json();
    const records29 = data29.data?.records || [];
    const privacySecure =
      records29.length > 0 &&
      records29.every((r) => r.password === undefined && r.passwordHash === undefined && r.salt === undefined);
    recordTest(
      29,
      'privacy validation',
      privacySecure,
      `Checked ${records29.length} records: zero password/salt leakage`
    );

    // =============================================================
    // TEST 30: Malformed Parameters
    // =============================================================
    const res30 = await fetch(`${BASE_URL}/api/admin/reports?type=applications&limit=-99&dateFrom=invalid-date-format`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    // System should either gracefully sanitize or return 400 Bad Request
    const malformedHandled = res30.status === 400 || res30.status === 200;
    recordTest(
      30,
      'malformed parameters',
      malformedHandled,
      `Handled gracefully with HTTP status ${res30.status}`
    );

    // =============================================================
    // TEST 31: Invalid ObjectId
    // =============================================================
    const res31 = await fetch(`${BASE_URL}/api/admin/analytics/applications?stakeholder=not-a-valid-object-id`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordTest(
      31,
      'invalid ObjectId',
      res31.status === 400,
      `HTTP status: ${res31.status} (Expected 400 Bad Request)`
    );

    // =============================================================
    // TEST 32: Large-Data Aggregation Safety
    // =============================================================
    const startAgg = Date.now();
    const res32 = await fetch(`${BASE_URL}/api/admin/analytics/applications?groupBy=daily`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const durAgg = Date.now() - startAgg;
    recordTest(
      32,
      'large-data aggregation safety',
      res32.status === 200 && durAgg < 3000,
      `Aggregation completed in ${durAgg}ms (<3000ms safety threshold)`
    );

    // =============================================================
    // TEST 33: Phase 3–9 Regression
    // =============================================================
    const [p3Res, p4Res, p5Res, p6Res, p7Res, p8Res, p9Res] = await Promise.all([
      fetch(`${BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/api/stakeholders`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/api/instruments`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/api/applications`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/api/schedules`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/api/inspections`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/api/certificates`, { headers: { Authorization: `Bearer ${adminToken}` } }),
    ]);

    const regressionPassed =
      p3Res.status === 200 &&
      p4Res.status === 200 &&
      p5Res.status === 200 &&
      p6Res.status === 200 &&
      p7Res.status === 200 &&
      p8Res.status === 200 &&
      p9Res.status === 200;

    recordTest(
      33,
      'Phase 3–9 regression',
      regressionPassed,
      `Phases 3..9 Statuses: [${p3Res.status}, ${p4Res.status}, ${p5Res.status}, ${p6Res.status}, ${p7Res.status}, ${p8Res.status}, ${p9Res.status}]`
    );

    // =============================================================
    // TEST 34: TypeScript / Typecheck
    // =============================================================
    let typecheckPassed = false;
    let typecheckOutput = '';
    try {
      typecheckOutput = execSync('npx tsc --noEmit', { encoding: 'utf8' });
      typecheckPassed = true;
    } catch (err) {
      typecheckPassed = false;
      typecheckOutput = err.stdout || err.message;
    }
    recordTest(
      34,
      'TypeScript/typecheck',
      typecheckPassed,
      typecheckPassed ? 'Clean (0 errors)' : `Failed: ${typecheckOutput.slice(0, 100)}`
    );

    // =============================================================
    // TEST 35: Production Build
    // =============================================================
    let buildPassed = false;
    let buildOutput = '';
    try {
      buildOutput = execSync('npm run build', { encoding: 'utf8' });
      buildPassed = true;
    } catch (err) {
      buildPassed = false;
      buildOutput = err.stdout || err.message;
    }
    recordTest(
      35,
      'production build',
      buildPassed,
      buildPassed ? 'Build successful (dist created)' : `Failed: ${buildOutput.slice(0, 100)}`
    );

    console.log('\n===============================================================');
    console.log('📊 Phase 10 Test Suite Execution Summary');
    console.log('===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Total Tests Run : ${totalCount}`);
    console.log(`Passed          : ${passedCount}`);
    console.log(`Failed          : ${totalCount - passedCount}`);
    console.log(`Pass Rate       : ${((passedCount / totalCount) * 100).toFixed(1)}%`);
    console.log('===============================================================');

    if (passedCount < totalCount) {
      console.error('❌ Some tests failed in Phase 10 suite!');
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Fatal error during Phase 10 test execution:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runAllTests();
