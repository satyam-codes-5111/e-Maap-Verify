/**
 * Phase 9: Notifications + Expiry & Due-Date Tracking Test Suite
 * Validates real MongoDB operations, dynamic expiry & due status calculation,
 * reminder window processing (60, 30, 7 days, expired), duplicate alert prevention,
 * notification preferences (inApp, email, categories, reminder windows), read/unread management,
 * unread count, deletion, pagination, filtering, strict RBAC cross-user isolation,
 * exclusion of revoked & cancelled certificates, overdue application SLA escalation,
 * and manual/scheduled background worker triggers.
 */

import { ENV } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { Certificate } from '../models/Certificate.js';
import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  CERTIFICATE_STATUSES,
  DYNAMIC_CERTIFICATE_STATUSES,
  INSTRUMENT_DUE_STATUSES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  AUDIT_ACTIONS,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
  INSTRUMENT_STATUSES,
} from '../config/constants.js';
import {
  calculateCertificateDynamicStatus,
  calculateInstrumentDueStatus,
  checkExpiringCertificates,
  checkInstrumentsDue,
  checkOverdueApplications,
  runExpiryAndDueDateChecks,
} from '../services/expiryService.js';
import {
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notificationService.js';

const BASE_URL = 'http://localhost:3000';

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] Test ${id}: ${name} ${details ? `(${details})` : ''}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('🔔 Starting Phase 9: Notifications + Expiry / Due-Date Test Suite');
  console.log('===============================================================\n');

  await connectDB();

  const adminEmail = ENV.ADMIN_INITIAL_EMAIL;
  const adminPassword = ENV.ADMIN_INITIAL_PASSWORD;

  let adminToken = '';
  let officerToken = '';
  let user1Token = '';
  let user2Token = '';

  let adminUser = null;
  let officerUser = null;
  let user1 = null;
  let user2 = null;
  let stakeholder1 = null;
  let stakeholder2 = null;

  try {
    // -------------------------------------------------------------
    // Setup: Provision Test Users and Stakeholders
    // -------------------------------------------------------------
    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminData = await adminLoginRes.json();
    adminToken = adminData.data?.token;
    adminUser = await User.findOne({ email: adminEmail });

    // Officer
    officerUser = await User.findOne({ email: 'phase9_officer@doca.gov.in' });
    if (!officerUser) {
      officerUser = new User({
        name: 'Officer Rajesh Sharma',
        email: 'phase9_officer@doca.gov.in',
        phone: '9822998877',
        role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
        designation: 'Senior Legal Metrology Officer',
        jurisdiction: { state: 'Maharashtra', district: 'Mumbai', zone: 'Central' },
        isActive: true,
      });
      officerUser.password = 'Inspector@123';
      await officerUser.save();
    }
    const offLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase9_officer@doca.gov.in', password: 'Inspector@123' }),
    });
    officerToken = (await offLoginRes.json()).data?.token;

    // Stakeholder User 1
    user1 = await User.findOne({ email: 'phase9_biz1@test.com' });
    if (!user1) {
      user1 = new User({
        name: 'Arun Verma',
        email: 'phase9_biz1@test.com',
        phone: '9811002233',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
    }
    user1.password = 'Stakeholder@123';
    await user1.save();

    const u1LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase9_biz1@test.com', password: 'Stakeholder@123' }),
    });
    const u1Json = await u1LoginRes.json();
    user1Token = u1Json.data?.token;

    stakeholder1 = await Stakeholder.findOne({ user: user1._id });
    if (!stakeholder1) {
      stakeholder1 = await Stakeholder.create({
        user: user1._id,
        businessName: 'Apex Logistics & Warehousing Pvt Ltd',
        tradeLicenseNumber: 'TL/MH/PH9/001',
        category: 'COMMERCIAL_ESTABLISHMENT',
        registeredAddress: {
          street: 'Plot 45, Kurla Industrial Estate',
          city: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400070',
        },
        contactPerson: {
          name: 'Arun Verma',
          email: 'phase9_biz1@test.com',
          phone: '9811002233',
        },
      });
    }

    // Stakeholder User 2
    user2 = await User.findOne({ email: 'phase9_biz2@test.com' });
    if (!user2) {
      user2 = new User({
        name: 'Deepak Chopra',
        email: 'phase9_biz2@test.com',
        phone: '9811004455',
        role: USER_ROLES.BUSINESS_USER,
        isActive: true,
      });
    }
    user2.password = 'Stakeholder@123';
    await user2.save();

    const u2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phase9_biz2@test.com', password: 'Stakeholder@123' }),
    });
    const u2Json = await u2LoginRes.json();
    user2Token = u2Json.data?.token;

    stakeholder2 = await Stakeholder.findOne({ user: user2._id });
    if (!stakeholder2) {
      stakeholder2 = await Stakeholder.create({
        user: user2._id,
        businessName: 'Coastal Fuel Retailers LLP',
        tradeLicenseNumber: 'TL/MH/PH9/002',
        category: 'REPAIRER',
        registeredAddress: {
          street: 'Unit 12, Chembur Terminal',
          city: 'Mumbai',
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400074',
        },
        contactPerson: {
          name: 'Deepak Chopra',
          email: 'phase9_biz2@test.com',
          phone: '9811004455',
        },
      });
    }

    // Clean previous test notifications for clean test suite runs
    await Notification.deleteMany({
      recipient: { $in: [user1._id, user2._id, officerUser._id] },
    });
    await NotificationPreference.deleteMany({
      user: { $in: [user1._id, user2._id, officerUser._id] },
    });

    // =========================================================================
    // TEST 1: In-App Notification Model Creation & Schema Verification
    // =========================================================================
    const testNotif1 = await createNotification({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.APPLICATION_SUBMITTED,
      title: 'Application Submitted Successfully',
      message: 'Your application has been received by the department.',
      relatedEntityType: 'Application',
      relatedEntityId: user1._id,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      link: '/applications/view',
      metadata: { testMeta: 'sample_value' },
      sendEmailAlert: false,
    });

    const isTest1Valid =
      testNotif1 &&
      testNotif1._id &&
      testNotif1.recipient.toString() === user1._id.toString() &&
      testNotif1.priority === NOTIFICATION_PRIORITIES.MEDIUM &&
      testNotif1.isRead === false &&
      testNotif1.relatedEntityType === 'Application';
    recordTest(1, 'In-App Notification Model Creation & Schema Verification', isTest1Valid, `ID: ${testNotif1?._id}`);

    // =========================================================================
    // TEST 2: Notification Preferences Auto-Creation & Default Values
    // =========================================================================
    const prefsUser1 = await getNotificationPreferences(user1._id);
    const isTest2Valid =
      prefsUser1 &&
      prefsUser1.inAppEnabled === true &&
      prefsUser1.emailEnabled === true &&
      prefsUser1.reminderWindows?.day60 === true &&
      prefsUser1.reminderWindows?.day30 === true &&
      prefsUser1.reminderWindows?.day7 === true &&
      prefsUser1.reminderWindows?.onExpiry === true &&
      prefsUser1.categories?.certificateExpiry === true &&
      prefsUser1.categories?.verificationDue === true;
    recordTest(2, 'Notification Preferences Auto-Creation & Default Schema', isTest2Valid, `Pref ID: ${prefsUser1?._id}`);

    // =========================================================================
    // TEST 3: Update User Preferences in MongoDB
    // =========================================================================
    const updatedPrefs = await updateNotificationPreferences(user1._id, {
      reminderWindows: { day60: false },
      categories: { verificationDue: false },
    });
    const isTest3Valid =
      updatedPrefs.reminderWindows.day60 === false &&
      updatedPrefs.reminderWindows.day30 === true &&
      updatedPrefs.categories.verificationDue === false &&
      updatedPrefs.categories.certificateExpiry === true;
    recordTest(3, 'Update User Notification Preferences (Selective Toggles)', isTest3Valid);

    // =========================================================================
    // TEST 4: Preference Enforcement - Opted-Out Category Suppresses Creation
    // =========================================================================
    // user1 has opted out of verificationDue category
    const suppressedCategoryNotif = await createNotification({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.VERIFICATION_DUE,
      title: 'Verification Due Soon',
      message: 'This should be suppressed because verificationDue is disabled.',
      sendEmailAlert: false,
    });
    recordTest(
      4,
      'Preference Enforcement: Disabled Category Suppresses Notification',
      suppressedCategoryNotif === null,
      'Notification correctly skipped'
    );

    // =========================================================================
    // TEST 5: Preference Enforcement - Opted-Out Reminder Window Suppresses Creation
    // =========================================================================
    // user1 has opted out of day60 reminder window
    const suppressedWindowNotif = await createNotification({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60,
      title: 'Certificate Expiring in 60 Days',
      message: 'This should be suppressed because day60 is disabled.',
      sendEmailAlert: false,
    });
    recordTest(
      5,
      'Preference Enforcement: Disabled Reminder Window Suppresses Alert',
      suppressedWindowNotif === null,
      '60-day reminder correctly skipped'
    );

    // =========================================================================
    // TEST 6: Preference Enforcement - Disabled In-App Completely Suppresses Creation
    // =========================================================================
    await updateNotificationPreferences(user2._id, { inAppEnabled: false });
    const suppressedInAppNotif = await createNotification({
      recipient: user2._id,
      type: NOTIFICATION_TYPES.APPLICATION_APPROVED,
      title: 'Application Approved',
      message: 'In-app notification should not be created.',
      sendEmailAlert: false,
    });
    recordTest(
      6,
      'Preference Enforcement: Global inAppEnabled=false Suppresses Storage',
      suppressedInAppNotif === null,
      'In-app notification skipped'
    );

    // Re-enable inAppEnabled for user2 and restore user1 preferences
    await updateNotificationPreferences(user2._id, { inAppEnabled: true });
    await updateNotificationPreferences(user1._id, {
      reminderWindows: { day60: true },
      categories: { verificationDue: true },
    });

    // =========================================================================
    // TEST 7: Priority Resolution Engine
    // =========================================================================
    const expiredNotif = await createNotification({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRED,
      title: 'Certificate Expired',
      message: 'Immediate verification required.',
      sendEmailAlert: false,
    });
    const dueSoonNotif = await createNotification({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7,
      title: 'Expiring in 7 Days',
      message: 'Submit reverification.',
      sendEmailAlert: false,
    });
    const normalNotif = await createNotification({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
      title: 'Certificate Issued',
      message: 'Certificate ready.',
      sendEmailAlert: false,
    });

    const isTest7Valid =
      expiredNotif.priority === NOTIFICATION_PRIORITIES.URGENT &&
      dueSoonNotif.priority === NOTIFICATION_PRIORITIES.HIGH &&
      normalNotif.priority === NOTIFICATION_PRIORITIES.MEDIUM;
    recordTest(7, 'Priority Resolution Engine (URGENT / HIGH / MEDIUM)', isTest7Valid);

    // =========================================================================
    // TEST 8: Certificate Expiry Dynamic Calculation (No Permanent Status Tampering)
    // =========================================================================
    const nowRef = new Date();
    const futureDate90 = new Date(nowRef.getTime() + 90 * 86400000);
    const futureDate15 = new Date(nowRef.getTime() + 15 * 86400000);
    const pastDate10 = new Date(nowRef.getTime() - 10 * 86400000);

    const activeStatus = calculateCertificateDynamicStatus({ validUntil: futureDate90, certificateStatus: 'ACTIVE' }, 30, nowRef);
    const expiringSoonStatus = calculateCertificateDynamicStatus({ validUntil: futureDate15, certificateStatus: 'ACTIVE' }, 30, nowRef);
    const expiredStatus = calculateCertificateDynamicStatus({ validUntil: pastDate10, certificateStatus: 'ACTIVE' }, 30, nowRef);
    const revokedStatus = calculateCertificateDynamicStatus({ validUntil: futureDate90, certificateStatus: 'REVOKED' }, 30, nowRef);
    const cancelledStatus = calculateCertificateDynamicStatus({ validUntil: futureDate90, certificateStatus: 'CANCELLED' }, 30, nowRef);

    const isTest8Valid =
      activeStatus === DYNAMIC_CERTIFICATE_STATUSES.ACTIVE &&
      expiringSoonStatus === DYNAMIC_CERTIFICATE_STATUSES.EXPIRING_SOON &&
      expiredStatus === DYNAMIC_CERTIFICATE_STATUSES.EXPIRED &&
      revokedStatus === DYNAMIC_CERTIFICATE_STATUSES.REVOKED &&
      cancelledStatus === DYNAMIC_CERTIFICATE_STATUSES.CANCELLED;
    recordTest(8, 'Certificate Expiry Dynamic Status Calculation', isTest8Valid, `States: ${activeStatus}, ${expiringSoonStatus}, ${expiredStatus}`);

    // =========================================================================
    // TEST 9: Instrument Due-Date Dynamic Calculation
    // =========================================================================
    const instUpToDate = calculateInstrumentDueStatus({ nextVerificationDueDate: futureDate90 }, 30, nowRef);
    const instDueSoon = calculateInstrumentDueStatus({ nextVerificationDueDate: futureDate15 }, 30, nowRef);
    const instOverdue = calculateInstrumentDueStatus({ nextVerificationDueDate: pastDate10 }, 30, nowRef);

    const isTest9Valid =
      instUpToDate === INSTRUMENT_DUE_STATUSES.UP_TO_DATE &&
      instDueSoon === INSTRUMENT_DUE_STATUSES.DUE_SOON &&
      instOverdue === INSTRUMENT_DUE_STATUSES.OVERDUE;
    recordTest(9, 'Instrument Due-Date Dynamic Status Calculation', isTest9Valid, `States: ${instUpToDate}, ${instDueSoon}, ${instOverdue}`);

    // =========================================================================
    // Setup Test Data for Expiry and Due-Date Engine Services
    // =========================================================================
    // Provision 4 Instruments
    const instrumentActive = await Instrument.create({
      instrumentId: 'INST-PH9-ACT-' + Date.now(),
      stakeholder: stakeholder1._id,
      category: INSTRUMENT_CATEGORIES.WEIGHBRIDGE,
      instrumentType: 'Electronic Pitless Weighbridge',
      manufacturer: 'Avery India',
      modelNumber: 'AV-5000',
      serialNumber: 'SN-ACT-' + Date.now(),
      capacity: { value: 50000, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      verificationScaleInterval_e: '10kg',
      installationAddress: {
        premiseName: 'Kurla Logistics Yard',
        addressLine: 'Plot 45, Kurla Industrial Estate',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400070',
      },
      nextVerificationDueDate: new Date(nowRef.getTime() + 100 * 86400000), // Up to date
      isActive: true,
      status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
    });

    const instrumentDueSoon = await Instrument.create({
      instrumentId: 'INST-PH9-DUE-' + Date.now(),
      stakeholder: stakeholder1._id,
      category: INSTRUMENT_CATEGORIES.COUNTER_SCALE,
      instrumentType: 'Digital Counter Computing Scale',
      manufacturer: 'Eagle Scales',
      modelNumber: 'EG-200',
      serialNumber: 'SN-DUE-' + Date.now(),
      capacity: { value: 50, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III_MEDIUM,
      verificationScaleInterval_e: '5g',
      installationAddress: {
        premiseName: 'Retail Counter',
        addressLine: 'Shop 12, Terminal Area',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400070',
      },
      nextVerificationDueDate: new Date(nowRef.getTime() + 14 * 86400000), // Due in 14 days
      isActive: true,
      status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
    });

    const instrumentOverdue = await Instrument.create({
      instrumentId: 'INST-PH9-OVD-' + Date.now(),
      stakeholder: stakeholder1._id,
      category: INSTRUMENT_CATEGORIES.FUEL_DISPENSER,
      instrumentType: 'Electronic Multi-Product Dispenser',
      manufacturer: 'Gilbarco Veeder-Root',
      modelNumber: 'GB-99',
      serialNumber: 'SN-OVD-' + Date.now(),
      capacity: { value: 100, unit: 'L' },
      accuracyClass: ACCURACY_CLASSES.CLASS_II_HIGH,
      verificationScaleInterval_e: '10ml',
      installationAddress: {
        premiseName: 'Fueling Bay 4',
        addressLine: 'Chembur Terminal Complex',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400074',
      },
      nextVerificationDueDate: new Date(nowRef.getTime() - 15 * 86400000), // Overdue by 15 days
      isActive: true,
      status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
    });

    // Helper to provision Certificate with its required Application & Hash
    const createTestCert = async ({ certNumber, instrumentId, status = CERTIFICATE_STATUSES.ACTIVE, validFrom, validUntil, revokedAt }) => {
      const app = await VerificationApplication.create({
        applicationNumber: 'APP/PH9/' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        stakeholder: stakeholder1._id,
        applicationType: APPLICATION_TYPES.RE_VERIFICATION,
        currentStatus: APPLICATION_STATUSES.COMPLETED,
        submittedAt: validFrom,
        submissionDate: validFrom,
        assignedLMO: officerUser._id,
        instrument: instrumentId,
        instruments: [instrumentId],
      });

      return Certificate.create({
        certificateNumber: certNumber,
        application: app._id,
        instrument: instrumentId,
        stakeholder: stakeholder1._id,
        certificateStatus: status,
        status: status,
        validFrom,
        validUntil,
        issuedBy: officerUser._id,
        issuedAt: validFrom,
        qrToken: 'TOKEN-' + Math.random().toString(36).substring(2, 10),
        tamperEvidentHash: 'hash-' + Math.random().toString(36).substring(2, 12),
        ...(revokedAt ? { revokedAt, revocationReason: 'Test Revocation' } : {}),
      });
    };

    // Provision Certificates
    // 1. 60-Day window: validUntil in 45 days
    const cert60 = await createTestCert({
      certNumber: 'DOCA/PH9/CERT60/' + Date.now(),
      instrumentId: instrumentActive._id,
      validFrom: new Date(nowRef.getTime() - 320 * 86400000),
      validUntil: new Date(nowRef.getTime() + 45 * 86400000),
    });

    // 2. 30-Day window: validUntil in 20 days
    const cert30 = await createTestCert({
      certNumber: 'DOCA/PH9/CERT30/' + Date.now(),
      instrumentId: instrumentDueSoon._id,
      validFrom: new Date(nowRef.getTime() - 345 * 86400000),
      validUntil: new Date(nowRef.getTime() + 20 * 86400000),
    });

    // 3. 7-Day window: validUntil in 5 days
    const cert7 = await createTestCert({
      certNumber: 'DOCA/PH9/CERT7/' + Date.now(),
      instrumentId: instrumentActive._id,
      validFrom: new Date(nowRef.getTime() - 360 * 86400000),
      validUntil: new Date(nowRef.getTime() + 5 * 86400000),
    });

    // 4. Expired Certificate: validUntil in past
    const certExpired = await createTestCert({
      certNumber: 'DOCA/PH9/CERTEXP/' + Date.now(),
      instrumentId: instrumentOverdue._id,
      validFrom: new Date(nowRef.getTime() - 380 * 86400000),
      validUntil: new Date(nowRef.getTime() - 15 * 86400000),
    });

    // 5. Revoked Certificate: validUntil in 10 days, but revoked!
    const certRevoked = await createTestCert({
      certNumber: 'DOCA/PH9/CERTREV/' + Date.now(),
      instrumentId: instrumentActive._id,
      status: CERTIFICATE_STATUSES.REVOKED,
      revokedAt: new Date(nowRef.getTime() - 5 * 86400000),
      validFrom: new Date(nowRef.getTime() - 355 * 86400000),
      validUntil: new Date(nowRef.getTime() + 10 * 86400000),
    });

    // 6. Cancelled Certificate: validUntil in 8 days, but cancelled!
    const certCancelled = await createTestCert({
      certNumber: 'DOCA/PH9/CERTCAN/' + Date.now(),
      instrumentId: instrumentActive._id,
      status: CERTIFICATE_STATUSES.CANCELLED,
      validFrom: new Date(nowRef.getTime() - 357 * 86400000),
      validUntil: new Date(nowRef.getTime() + 8 * 86400000),
    });

    // =========================================================================
    // TEST 10: Run checkExpiringCertificates - 60-Day Reminder Generated
    // =========================================================================
    const certCheckResult1 = await checkExpiringCertificates({ now: nowRef });
    const notifCert60 = await Notification.findOne({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60,
      relatedEntityId: cert60._id,
    });
    recordTest(10, 'Expiry Engine: 60-Day Reminder Dispatched', !!notifCert60, `Title: ${notifCert60?.title}`);

    // =========================================================================
    // TEST 11: 30-Day Reminder Generated
    // =========================================================================
    const notifCert30 = await Notification.findOne({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30,
      relatedEntityId: cert30._id,
    });
    recordTest(11, 'Expiry Engine: 30-Day Reminder Dispatched', !!notifCert30, `Priority: ${notifCert30?.priority}`);

    // =========================================================================
    // TEST 12: 7-Day Reminder Generated
    // =========================================================================
    const notifCert7 = await Notification.findOne({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7,
      relatedEntityId: cert7._id,
    });
    recordTest(12, 'Expiry Engine: 7-Day Urgent Reminder Dispatched', !!notifCert7, `Priority: ${notifCert7?.priority}`);

    // =========================================================================
    // TEST 13: Expired Certificate Generates URGENT Alert
    // =========================================================================
    const notifExpired = await Notification.findOne({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRED,
      relatedEntityId: certExpired._id,
    });
    const isTest13Valid =
      notifExpired &&
      notifExpired.priority === NOTIFICATION_PRIORITIES.URGENT &&
      notifExpired.title.includes('Expired');
    recordTest(13, 'Expiry Engine: Expired Certificate Dispatches URGENT Alert', isTest13Valid);

    // =========================================================================
    // TEST 14: Revoked Certificate Strictly Excluded From Expiry Alerts
    // =========================================================================
    const notifRevoked = await Notification.findOne({
      relatedEntityId: certRevoked._id,
      type: { $in: [NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7, NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30, NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60, NOTIFICATION_TYPES.CERTIFICATE_EXPIRED] },
    });
    recordTest(14, 'Expiry Engine: Revoked Certificate Strictly Excluded', notifRevoked === null);

    // =========================================================================
    // TEST 15: Cancelled Certificate Strictly Excluded From Expiry Alerts
    // =========================================================================
    const notifCancelled = await Notification.findOne({
      relatedEntityId: certCancelled._id,
      type: { $in: [NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_7, NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_30, NOTIFICATION_TYPES.CERTIFICATE_EXPIRING_60, NOTIFICATION_TYPES.CERTIFICATE_EXPIRED] },
    });
    recordTest(15, 'Expiry Engine: Cancelled Certificate Strictly Excluded', notifCancelled === null);

    // =========================================================================
    // TEST 16: Duplicate Prevention on Repeated Expiry Engine Runs
    // =========================================================================
    const certCheckResult2 = await checkExpiringCertificates({ now: nowRef });
    const isTest16Valid =
      certCheckResult2.remindersSent === 0 && certCheckResult2.duplicatesPrevented > 0;
    recordTest(
      16,
      'Duplicate Prevention: Repeated Expiry Checks Suppress Redundant Alerts',
      isTest16Valid,
      `Prevented: ${certCheckResult2.duplicatesPrevented}, Sent: ${certCheckResult2.remindersSent}`
    );

    // =========================================================================
    // TEST 17: Instrument Due Engine - DUE_SOON Alert
    // =========================================================================
    const instCheckResult1 = await checkInstrumentsDue({ now: nowRef });
    const notifInstDue = await Notification.findOne({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.VERIFICATION_DUE,
      relatedEntityId: instrumentDueSoon._id,
    });
    const isTest17Valid = notifInstDue && notifInstDue.priority === NOTIFICATION_PRIORITIES.HIGH;
    recordTest(17, 'Due-Date Engine: DUE_SOON Instrument Alert Dispatched', isTest17Valid);

    // =========================================================================
    // TEST 18: Instrument Due Engine - OVERDUE Alert
    // =========================================================================
    const notifInstOverdue = await Notification.findOne({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.VERIFICATION_OVERDUE,
      relatedEntityId: instrumentOverdue._id,
    });
    const isTest18Valid =
      notifInstOverdue && notifInstOverdue.priority === NOTIFICATION_PRIORITIES.URGENT;
    recordTest(18, 'Due-Date Engine: OVERDUE Instrument Alert Dispatched (URGENT)', isTest18Valid);

    // =========================================================================
    // TEST 19: Duplicate Prevention on Repeated Instrument Due Runs
    // =========================================================================
    const instCheckResult2 = await checkInstrumentsDue({ now: nowRef });
    const isTest19Valid =
      instCheckResult2.alertsSent === 0 && instCheckResult2.duplicatesPrevented > 0;
    recordTest(
      19,
      'Duplicate Prevention: Repeated Instrument Due Runs Suppress Redundant Alerts',
      isTest19Valid,
      `Prevented: ${instCheckResult2.duplicatesPrevented}`
    );

    // =========================================================================
    // TEST 20: Overdue Application SLA Alert
    // =========================================================================
    const overdueApp = await VerificationApplication.create({
      applicationNumber: 'APP/PH9/OVD/' + Date.now(),
      stakeholder: stakeholder1._id,
      applicationType: APPLICATION_TYPES.RE_VERIFICATION,
      currentStatus: APPLICATION_STATUSES.SUBMITTED,
      submittedAt: new Date(nowRef.getTime() - 25 * 86400000), // submitted 25 days ago (SLA threshold 15)
      submissionDate: new Date(nowRef.getTime() - 25 * 86400000),
      assignedLMO: officerUser._id,
      instrument: instrumentActive._id,
      instruments: [instrumentActive._id],
      statusHistory: [
        {
          fromStatus: APPLICATION_STATUSES.DRAFT,
          toStatus: APPLICATION_STATUSES.SUBMITTED,
          changedBy: user1._id,
          timestamp: new Date(nowRef.getTime() - 25 * 86400000),
        },
      ],
    });

    const appCheckResult = await checkOverdueApplications({ now: nowRef });
    const overdueNotif = await Notification.findOne({
      recipient: officerUser._id,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      relatedEntityId: overdueApp._id,
    });
    recordTest(20, 'Overdue Application SLA Escalation Dispatched to Officer', !!overdueNotif, `Title: ${overdueNotif?.title}`);

    // =========================================================================
    // TEST 21: Full Orchestration Runner (runExpiryAndDueDateChecks)
    // =========================================================================
    const fullJobResult = await runExpiryAndDueDateChecks({
      now: nowRef,
      triggeredBy: adminUser,
    });
    const isTest21Valid =
      fullJobResult.success === true &&
      fullJobResult.certificates &&
      fullJobResult.instruments &&
      fullJobResult.applications &&
      typeof fullJobResult.durationMs === 'number';
    recordTest(21, 'Full Expiry & Due-Date Job Orchestration Runner', isTest21Valid, `Duration: ${fullJobResult.durationMs}ms`);

    // Verify audit log for the job execution
    const auditJob = await AuditLog.findOne({
      action: AUDIT_ACTIONS.EXPIRY_CHECK_EXECUTED,
      user: adminUser._id,
    });
    recordTest(21.1, 'Audit Log Created for Expiry Check Execution', !!auditJob);

    // =========================================================================
    // TEST 22: API - GET /api/notifications (User's Notifications List with Pagination)
    // =========================================================================
    const listRes = await fetch(`${BASE_URL}/api/notifications?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const listData = await listRes.json();
    const notifItems = listData.data?.items || listData.data?.data || [];
    const isTest22Valid =
      listRes.status === 200 &&
      Array.isArray(notifItems) &&
      notifItems.length > 0 &&
      notifItems.every((n) => n.recipient.toString() === user1._id.toString());
    recordTest(22, 'API: GET /api/notifications (Paginated, Isolated)', isTest22Valid, `Count: ${notifItems.length}`);

    // =========================================================================
    // TEST 23: API - GET /api/notifications/unread-count
    // =========================================================================
    const unreadRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const unreadData = await unreadRes.json();
    const dbUnreadCount = await Notification.countDocuments({ recipient: user1._id, isRead: false });
    const isTest23Valid =
      unreadRes.status === 200 && unreadData.data?.unreadCount === dbUnreadCount;
    recordTest(23, 'API: GET /api/notifications/unread-count Accurately Reflects MongoDB', isTest23Valid, `Unread: ${dbUnreadCount}`);

    // =========================================================================
    // TEST 24: API - PATCH /api/notifications/:id/read (Mark Individual as Read)
    // =========================================================================
    const sampleNotif = await Notification.findOne({ recipient: user1._id, isRead: false });
    const markReadRes = await fetch(`${BASE_URL}/api/notifications/${sampleNotif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const markReadData = await markReadRes.json();
    const updatedDbNotif = await Notification.findById(sampleNotif._id);
    const isTest24Valid =
      markReadRes.status === 200 &&
      markReadData.data?.isRead === true &&
      updatedDbNotif.isRead === true &&
      updatedDbNotif.readAt !== null;
    recordTest(24, 'API: PATCH /api/notifications/:id/read Sets isRead & readAt', isTest24Valid);

    // =========================================================================
    // TEST 25: API - PATCH /api/notifications/read-all (Bulk Mark Read)
    // =========================================================================
    const bulkReadRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const bulkReadData = await bulkReadRes.json();
    const remainingUnread = await Notification.countDocuments({ recipient: user1._id, isRead: false });
    const isTest25Valid = bulkReadRes.status === 200 && remainingUnread === 0;
    recordTest(25, 'API: PATCH /api/notifications/read-all Marks All User Notifications Read', isTest25Valid, `Modified: ${bulkReadData.data?.modifiedCount}`);

    // =========================================================================
    // TEST 26: API - DELETE /api/notifications/:id
    // =========================================================================
    const notifToDelete = await Notification.findOne({ recipient: user1._id });
    const deleteRes = await fetch(`${BASE_URL}/api/notifications/${notifToDelete._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const deletedDb = await Notification.findById(notifToDelete._id);
    recordTest(26, 'API: DELETE /api/notifications/:id Deletes User Notification', deleteRes.status === 200 && deletedDb === null);

    // =========================================================================
    // TEST 27: API - Filter Notifications by Priority
    // =========================================================================
    // Create an explicit URGENT notification for user1
    await createNotification({
      recipient: user1._id,
      type: NOTIFICATION_TYPES.CERTIFICATE_EXPIRED,
      title: 'Urgent Alert Test',
      message: 'Urgent priority test notice',
      priority: NOTIFICATION_PRIORITIES.URGENT,
      sendEmailAlert: false,
    });

    const filterPriorityRes = await fetch(
      `${BASE_URL}/api/notifications?priority=${NOTIFICATION_PRIORITIES.URGENT}`,
      { headers: { Authorization: `Bearer ${user1Token}` } }
    );
    const filterPriorityData = await filterPriorityRes.json();
    const items27 = filterPriorityData.data?.items || filterPriorityData.data?.data || [];
    const isTest27Valid =
      filterPriorityRes.status === 200 &&
      items27.length > 0 &&
      items27.every((n) => n.priority === NOTIFICATION_PRIORITIES.URGENT);
    recordTest(27, 'API: Filter Notifications by Priority (URGENT)', isTest27Valid, `Found: ${items27.length}`);

    // =========================================================================
    // TEST 28: API - Filter Notifications by Status (isRead)
    // =========================================================================
    const filterReadRes = await fetch(`${BASE_URL}/api/notifications?isRead=false`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const filterReadData = await filterReadRes.json();
    const items28 = filterReadData.data?.items || filterReadData.data?.data || [];
    const isTest28Valid =
      filterReadRes.status === 200 &&
      items28.length > 0 &&
      items28.every((n) => n.isRead === false);
    recordTest(28, 'API: Filter Notifications by Status (isRead=false)', isTest28Valid, `Found: ${items28.length}`);

    // =========================================================================
    // TEST 29: API - Filter Notifications by Type
    // =========================================================================
    const filterTypeRes = await fetch(
      `${BASE_URL}/api/notifications?type=${NOTIFICATION_TYPES.CERTIFICATE_EXPIRED}`,
      { headers: { Authorization: `Bearer ${user1Token}` } }
    );
    const filterTypeData = await filterTypeRes.json();
    const items29 = filterTypeData.data?.items || filterTypeData.data?.data || [];
    const isTest29Valid =
      filterTypeRes.status === 200 &&
      items29.length > 0 &&
      items29.every((n) => n.type === NOTIFICATION_TYPES.CERTIFICATE_EXPIRED);
    recordTest(29, 'API: Filter Notifications by Type (CERTIFICATE_EXPIRED)', isTest29Valid, `Found: ${items29.length}`);

    // =========================================================================
    // TEST 30: API - Filter Notifications by relatedEntityType
    // =========================================================================
    const filterEntityRes = await fetch(
      `${BASE_URL}/api/notifications?relatedEntityType=Certificate`,
      { headers: { Authorization: `Bearer ${user1Token}` } }
    );
    const filterEntityData = await filterEntityRes.json();
    const items30 = filterEntityData.data?.items || filterEntityData.data?.data || [];
    const isTest30Valid =
      filterEntityRes.status === 200 &&
      items30.length > 0 &&
      items30.every((n) => n.relatedEntityType === 'Certificate');
    recordTest(30, 'API: Filter Notifications by relatedEntityType (Certificate)', isTest30Valid, `Found: ${items30.length}`);

    // =========================================================================
    // TEST 31: RBAC / Cross-User Isolation - User B Cannot Read User A's Notification
    // =========================================================================
    const user1Notif = await Notification.findOne({ recipient: user1._id });
    const crossReadRes = await fetch(`${BASE_URL}/api/notifications/${user1Notif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    recordTest(
      31,
      'RBAC Isolation: Cross-User Mark Read Returns 403 Forbidden',
      crossReadRes.status === 403,
      `HTTP Status: ${crossReadRes.status}`
    );

    // =========================================================================
    // TEST 32: RBAC / Cross-User Isolation - User B Cannot Delete User A's Notification
    // =========================================================================
    const crossDeleteRes = await fetch(`${BASE_URL}/api/notifications/${user1Notif._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    recordTest(
      32,
      'RBAC Isolation: Cross-User Delete Returns 403 Forbidden',
      crossDeleteRes.status === 403,
      `HTTP Status: ${crossDeleteRes.status}`
    );

    // =========================================================================
    // TEST 33: RBAC / Cross-User Isolation - User B Notification List Shows 0 of User A's
    // =========================================================================
    const user2ListRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const user2ListData = await user2ListRes.json();
    const user2Items = user2ListData.data?.items || user2ListData.data?.data || [];
    const leaksFound = user2Items.some(
      (n) => n.recipient.toString() === user1._id.toString()
    );
    recordTest(
      33,
      'RBAC Isolation: User List Zero-Leakage Guarantee',
      user2ListRes.status === 200 && leaksFound === false,
      'Strict recipient-only isolation'
    );

    // =========================================================================
    // TEST 34: API - GET & PUT /api/notifications/preferences
    // =========================================================================
    const getPrefRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const getPrefData = await getPrefRes.json();

    const putPrefRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        emailEnabled: false,
        reminderWindows: { day30: false },
      }),
    });
    const putPrefData = await putPrefRes.json();

    const isTest34Valid =
      getPrefRes.status === 200 &&
      putPrefRes.status === 200 &&
      putPrefData.data?.emailEnabled === false &&
      putPrefData.data?.reminderWindows?.day30 === false;
    recordTest(34, 'API: GET & PUT /api/notifications/preferences Endpoints', isTest34Valid);

    // =========================================================================
    // TEST 35: API - POST /api/notifications/run-expiry-checks (Admin Trigger Endpoint)
    // =========================================================================
    // Standard user call (Forbidden)
    const forbiddenTriggerRes = await fetch(`${BASE_URL}/api/notifications/run-expiry-checks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    // Admin user call (Authorized)
    const adminTriggerRes = await fetch(`${BASE_URL}/api/notifications/run-expiry-checks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminTriggerData = await adminTriggerRes.json();

    const isTest35Valid =
      forbiddenTriggerRes.status === 403 &&
      adminTriggerRes.status === 200 &&
      adminTriggerData.data?.success === true;
    recordTest(
      35,
      'API: POST /api/notifications/run-expiry-checks (RBAC Enforced)',
      isTest35Valid,
      `Forbidden Status: ${forbiddenTriggerRes.status}, Admin Status: ${adminTriggerRes.status}`
    );

    // =========================================================================
    // TEST 36: Audit Logging for Notification Preference Updates
    // =========================================================================
    const auditPref = await AuditLog.findOne({
      action: AUDIT_ACTIONS.NOTIFICATION_PREFERENCE_UPDATED,
      user: user1._id,
    });
    recordTest(36, 'Audit Trail: Preference Updates Recorded in AuditLog', !!auditPref);
  } catch (error) {
    console.error('\n❌ Unhandled exception during Phase 9 test execution:', error);
    recordTest('FATAL', 'Test Suite Execution', false, error.message);
  } finally {
    console.log('\n===============================================================');
    console.log('📊 Phase 9 Test Suite Execution Summary');
    console.log('===============================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    console.log(`Total Tests Run : ${total}`);
    console.log(`Passed          : ${passed}`);
    console.log(`Failed          : ${failed}`);
    console.log(`Pass Rate       : ${((passed / total) * 100).toFixed(1)}%`);
    console.log('===============================================================\n');

    await disconnectDB();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runAllTests();
