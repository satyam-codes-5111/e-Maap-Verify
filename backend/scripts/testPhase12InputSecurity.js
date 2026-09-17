import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationSchedule } from '../models/VerificationSchedule.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import {
  USER_ROLES,
  APPLICATION_STATUSES,
  INSTRUMENT_STATUSES,
  INSTRUMENT_CATEGORIES,
  ACCURACY_CLASSES,
} from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failureDetails = [];

function assert(condition, message, detail = '') {
  if (condition) {
    passed++;
    console.log(`[✅ PASS] Test ${passed + failed}: ${message} ${detail ? `(${detail})` : ''}`);
  } else {
    failed++;
    const failMsg = `[❌ FAIL] Test ${passed + failed}: ${message} ${detail ? `(${detail})` : ''}`;
    console.error(failMsg);
    failureDetails.push(failMsg);
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      jurisdiction: user.jurisdiction,
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof FormData) && !(typeof body === 'string')) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  } else if (typeof body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

function verifyNoInformationLeak(res, testName) {
  const bodyStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || {});
  const hasStack = Boolean(res.data && res.data.stack);
  const hasInternalPath = bodyStr.includes('/backend/') || bodyStr.includes('node_modules');
  const hasMongoDetails = bodyStr.includes('MongoServerError') || bodyStr.includes('TopologyDescription');
  const hasSecret = Boolean(
    (ENV.JWT_SECRET && ENV.JWT_SECRET.length > 5 && bodyStr.includes(ENV.JWT_SECRET)) ||
    (ENV.MONGO_URI && ENV.MONGO_URI.length > 5 && bodyStr.includes(ENV.MONGO_URI))
  );

  assert(
    !hasStack && !hasInternalPath && !hasMongoDetails && !hasSecret,
    `${testName} - No internal leaks (no stack traces, filesystem paths, or db internals)`,
    `status: ${res.status}`
  );
}

async function runInputSecurityTests() {
  console.log('========================================================================');
  console.log('🛡️ Phase 12 Part 2 — Task 3: Input Validation, Injection & Request Security');
  console.log('========================================================================\n');

  await connectDB();

  // Retrieve active test actors from real database
  const superAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN, isActive: true });
  const admin = await User.findOne({ role: USER_ROLES.ADMIN, isActive: true });
  const lmo = await User.findOne({ role: USER_ROLES.LEGAL_METROLOGY_OFFICER, isActive: true });
  const fvo = await User.findOne({ role: USER_ROLES.FIELD_VERIFICATION_OFFICER, isActive: true });
  const businessUser = await User.findOne({ role: USER_ROLES.BUSINESS_USER, isActive: true });

  if (!superAdmin || !admin || !lmo || !fvo || !businessUser) {
    throw new Error('Database missing one or more required active test user roles. Seed or verify DB first.');
  }

  const superAdminToken = generateToken(superAdmin);
  const adminToken = generateToken(admin);
  const lmoToken = generateToken(lmo);
  const fvoToken = generateToken(fvo);
  const bizToken = generateToken(businessUser);

  let stakeholder = await Stakeholder.findOne({ user: businessUser._id });
  if (!stakeholder) {
    stakeholder = await Stakeholder.create({
      user: businessUser._id,
      businessName: 'Phase 12 Secure Commerce Ltd',
      tradeLicenseNumber: `TL-SEC-${Date.now()}`,
      businessType: 'RETAILER',
      phone: '9876543210',
      email: businessUser.email,
      contactPerson: {
        name: 'Contact Person',
        email: businessUser.email,
        phone: '9876543210',
      },
      registeredAddress: {
        street: 'Commercial Street',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        pincode: '400001',
      },
    });
  }

  let testInstrument = await Instrument.findOne({ stakeholder: stakeholder._id });
  if (!testInstrument) {
    testInstrument = await Instrument.create({
      instrumentId: `INS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      stakeholder: stakeholder._id,
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Electronic Weighing Scale',
      manufacturer: 'SecureTest Precision Scales Ltd',
      modelNumber: 'SEC-2026-X1',
      serialNumber: `SEC-SN-${Date.now()}`,
      capacity: { value: 15, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '5g',
      status: INSTRUMENT_STATUSES.PENDING_VERIFICATION,
      installationAddress: {
        premiseName: 'Secure Trading Hub',
        addressLine: 'Plot 101 Security Enclave',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        pincode: '400001',
      },
    });
  }

  // =========================================================================
  // 1. NoSQL Injection Attacks ($ne, $gt, $gte, $regex, $or, $in)
  // =========================================================================
  console.log('\n--- 1. NoSQL Injection Protection ---');

  // 1.1 NoSQL Operator in Login body
  const noSqlLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: {
      email: { $ne: null },
      password: { $gt: '' },
    },
  });
  assert(
    noSqlLoginRes.status === 400,
    'Login rejects $ne/$gt MongoDB operator injection with 400 Bad Request',
    `got: ${noSqlLoginRes.status}`
  );
  verifyNoInformationLeak(noSqlLoginRes, 'NoSQL Login');

  // 1.2 NoSQL Operator in Instrument Query Filter
  const noSqlInstQuery = await api('/api/instruments?category[$ne]=COUNTER_SCALE', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    noSqlInstQuery.status === 400,
    'Instruments query rejects [$ne] operator filter with 400 Bad Request',
    `got: ${noSqlInstQuery.status}`
  );
  verifyNoInformationLeak(noSqlInstQuery, 'NoSQL Query Filter');

  // 1.3 NoSQL Operator in Stakeholder Query
  const noSqlStakeholderQuery = await api('/api/stakeholders?businessType[$gt]=A', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    noSqlStakeholderQuery.status === 400,
    'Stakeholder query rejects [$gt] operator filter with 400 Bad Request',
    `got: ${noSqlStakeholderQuery.status}`
  );

  // 1.4 NoSQL Operator in User Management Query
  const noSqlUserQuery = await api('/api/admin/users?role[$in][]=SUPER_ADMIN', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    noSqlUserQuery.status === 400,
    'User management query rejects [$in] operator filter with 400 Bad Request',
    `got: ${noSqlUserQuery.status}`
  );

  // 1.5 NoSQL Operator in Application Query Filter ($regex)
  const noSqlAppQuery = await api('/api/applications?applicationType[$regex]=.*', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    noSqlAppQuery.status === 400,
    'Application query rejects [$regex] operator filter with 400 Bad Request',
    `got: ${noSqlAppQuery.status}`
  );

  // 1.6 NoSQL Operator in URL Route Parameters
  const noSqlParamRes = await api('/api/instruments/$ne', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    noSqlParamRes.status === 400 || noSqlParamRes.status === 404,
    'URL param containing $ne operator safely rejected with 400/404',
    `got: ${noSqlParamRes.status}`
  );

  // =========================================================================
  // 2. XSS / HTML Injection Defense
  // =========================================================================
  console.log('\n--- 2. XSS / HTML Injection Protection ---');

  // 2.1 Script tag injection in Instrument Registration
  const xssScriptRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Electronic Scale <script>alert("XSS")</script>',
      manufacturer: 'Safe Weigh Corp',
      modelNumber: 'SW-100',
      serialNumber: `SW-${Date.now()}`,
      capacity: { value: 10, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '2g',
      installationAddress: {
        premiseName: 'General Store',
        addressLine: '123 Market Road',
        city: 'Nagpur',
        district: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440001',
      },
    },
  });
  assert(
    xssScriptRes.status === 400,
    'Instrument registration blocks active <script> tag with 400 Bad Request',
    `got: ${xssScriptRes.status}`
  );
  verifyNoInformationLeak(xssScriptRes, 'XSS Script Tag');

  // 2.2 Event Handler payload injection in remarks / descriptions
  const xssEventHandlerRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Platform Scale',
      manufacturer: 'Safe Weigh Corp',
      modelNumber: 'PS-500',
      serialNumber: `PS-${Date.now()}`,
      capacity: { value: 50, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '10g',
      remarks: 'Scale checked <img src="x" onerror="alert(1)">',
      installationAddress: {
        premiseName: 'Warehouse 4',
        addressLine: '456 Industrial Area',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
    },
  });
  assert(
    xssEventHandlerRes.status === 400,
    'Active event-handler payload (<img onerror=...>) rejected with 400 Bad Request',
    `got: ${xssEventHandlerRes.status}`
  );

  // 2.3 SVG onload payload injection in address fields
  const xssSvgRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Weighbridge System',
      manufacturer: 'HeavyScales Ltd',
      modelNumber: 'WB-1000',
      serialNumber: `WB-${Date.now()}`,
      capacity: { value: 1000, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '500g',
      installationAddress: {
        premiseName: '<svg onload="alert(document.cookie)">Toll Plaza',
        addressLine: 'National Highway 48',
        city: 'Thane',
        district: 'Thane',
        state: 'Maharashtra',
        pincode: '400601',
      },
    },
  });
  assert(
    xssSvgRes.status === 400,
    'Active SVG payload (<svg onload=...>) rejected with 400 Bad Request',
    `got: ${xssSvgRes.status}`
  );

  // 2.4 Javascript URI in search queries
  const xssUriRes = await api('/api/instruments?search=javascript:alert(1)', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    xssUriRes.status === 400,
    'Javascript: URI attack in search parameter blocked with 400 Bad Request',
    `got: ${xssUriRes.status}`
  );

  // 2.5 Stored XSS Verification: Verify database records contain NO active script tags
  const allInstruments = await Instrument.find({ remarks: { $regex: /<script/i } });
  assert(
    allInstruments.length === 0,
    'Database integrity check: Zero stored active script tags in Instrument records',
    `count: ${allInstruments.length}`
  );

  // =========================================================================
  // 3. ObjectId Validation (No CastError / 500)
  // =========================================================================
  console.log('\n--- 3. ObjectId Validation (No CastError / 500) ---');

  // 3.1 Non-hex malformed ID in Instrument route
  const badIdInstRes = await api('/api/instruments/not-a-valid-object-id', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    badIdInstRes.status === 400 || badIdInstRes.status === 404,
    'Malformed string ID in GET /api/instruments/:id returns controlled 400/404',
    `got: ${badIdInstRes.status}`
  );
  verifyNoInformationLeak(badIdInstRes, 'Malformed Instrument ID');

  // 3.2 24-character non-hex ID in Application route
  const nonHexAppRes = await api('/api/applications/507f1f77bcf86cd79943901z', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    nonHexAppRes.status === 400 || nonHexAppRes.status === 404,
    'Non-hex 24-character ID in GET /api/applications/:id returns controlled 400/404',
    `got: ${nonHexAppRes.status}`
  );

  // 3.3 Short numeric ID in Schedule route
  const numScheduleRes = await api('/api/schedules/12345', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    numScheduleRes.status === 400 || numScheduleRes.status === 404,
    'Short numeric ID in GET /api/schedules/:id returns controlled 400/404',
    `got: ${numScheduleRes.status}`
  );

  // 3.4 Malformed ID in Certificate route
  const badCertRes = await api('/api/certificates/invalid-id-xyz', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    badCertRes.status === 400 || badCertRes.status === 404,
    'Invalid ID in GET /api/certificates/:id returns controlled 400/404',
    `got: ${badCertRes.status}`
  );

  // 3.5 "null" literal string in Inspection route
  const nullInspectionRes = await api('/api/inspections/null', {
    headers: { Authorization: `Bearer ${lmoToken}` },
  });
  assert(
    nullInspectionRes.status === 400 || nullInspectionRes.status === 404,
    '"null" string ID in GET /api/inspections/:id returns controlled 400/404',
    `got: ${nullInspectionRes.status}`
  );

  // 3.6 "undefined" literal in PUT /api/instruments/:id
  const undefInstRes = await api('/api/instruments/undefined', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: { modelNumber: 'NEW-MODEL' },
  });
  assert(
    undefInstRes.status === 400 || undefInstRes.status === 404,
    '"undefined" string ID in PUT /api/instruments/:id returns controlled 400/404',
    `got: ${undefInstRes.status}`
  );

  // =========================================================================
  // 4. Enum / Status Validation
  // =========================================================================
  console.log('\n--- 4. Enum / Status Validation ---');

  // 4.1 Case-sensitivity bypass on Accuracy Class (lowercase)
  const caseBypassRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Counter Scale',
      manufacturer: 'Acme Scale Co',
      modelNumber: 'CS-10',
      serialNumber: `CS-${Date.now()}`,
      capacity: { value: 10, unit: 'kg' },
      accuracyClass: 'class_iii', // invalid lowercase
      verificationScaleInterval_e: '5g',
      installationAddress: {
        premiseName: 'Shop A',
        addressLine: 'Main St',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        pincode: '400001',
      },
    },
  });
  assert(
    caseBypassRes.status === 400,
    'Case-sensitivity bypass on accuracyClass (class_iii) rejected with 400',
    `got: ${caseBypassRes.status}`
  );

  // 4.2 Non-existent User Role update
  const fakeRoleRes = await api(`/api/admin/users/${businessUser._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${superAdminToken}` },
    body: {
      role: 'ROOT_SUPERUSER_OVERLORD',
    },
  });
  assert(
    fakeRoleRes.status === 400,
    'Non-existent user role rejected with 400 Bad Request',
    `got: ${fakeRoleRes.status}`
  );

  // 4.3 Non-existent Application Type
  const fakeAppTypeRes = await api('/api/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      instrumentId: testInstrument._id.toString(),
      applicationType: 'EXPRESS_INSTANT_BYPASS',
    },
  });
  assert(
    fakeAppTypeRes.status === 400,
    'Non-existent application type rejected with 400 Bad Request',
    `got: ${fakeAppTypeRes.status}`
  );

  // 4.4 Non-existent Verification Type
  const fakeVerifTypeRes = await api('/api/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      instrumentId: testInstrument._id.toString(),
      verificationType: 'AUTOMATIC_UNINSPECTED',
    },
  });
  assert(
    fakeVerifTypeRes.status === 400,
    'Non-existent verification type rejected with 400 Bad Request',
    `got: ${fakeVerifTypeRes.status}`
  );

  // 4.5 Injection payload inside enum field
  const injectEnumRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: { $ne: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT },
      instrumentType: 'Digital Scale',
      manufacturer: 'Brand X',
      modelNumber: 'X-1',
      serialNumber: `SN-${Date.now()}`,
      capacity: { value: 10, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '5g',
      installationAddress: {
        premiseName: 'Shop',
        addressLine: 'Road',
        city: 'City',
        district: 'District',
        state: 'State',
        pincode: '400001',
      },
    },
  });
  assert(
    injectEnumRes.status === 400,
    'Injection payload inside enum field rejected with 400 Bad Request',
    `got: ${injectEnumRes.status}`
  );

  // =========================================================================
  // 5. Required Field & Type Validation
  // =========================================================================
  console.log('\n--- 5. Required Field & Type Validation ---');

  // 5.1 Empty body on Login
  const emptyLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: {},
  });
  assert(
    emptyLoginRes.status === 400 && (emptyLoginRes.data?.errors?.length > 0 || emptyLoginRes.data?.message),
    'Empty login body returns structured 400 validation error',
    `got: ${emptyLoginRes.status}`
  );

  // 5.2 Whitespace-only string fields on User Profile Update
  const whitespaceNameRes = await api('/api/auth/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: { name: '     ' },
  });
  assert(
    whitespaceNameRes.status === 400,
    'Whitespace-only user name rejected with 400 Bad Request',
    `got: ${whitespaceNameRes.status}`
  );

  // 5.3 Null values on mandatory fields in Instrument creation
  const nullFieldsRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: null,
      manufacturer: null,
      serialNumber: null,
    },
  });
  assert(
    nullFieldsRes.status === 400,
    'Null values in required instrument fields rejected with 400 Bad Request',
    `got: ${nullFieldsRes.status}`
  );

  // 5.4 Type mismatch: String instead of numeric capacity value
  const typeMismatchRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Counter Scale',
      manufacturer: 'Scales Corp',
      modelNumber: 'SC-1',
      serialNumber: `SC-${Date.now()}`,
      capacity: { value: 'fifteen_kg', unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '5g',
      installationAddress: {
        premiseName: 'Shop A',
        addressLine: 'Main St',
        city: 'City',
        district: 'District',
        state: 'State',
        pincode: '400001',
      },
    },
  });
  assert(
    typeMismatchRes.status === 400,
    'Type mismatch (string for numeric capacity) rejected with 400 Bad Request',
    `got: ${typeMismatchRes.status}`
  );

  // 5.5 Type mismatch: Object instead of boolean for isActive filter
  const boolTypeMismatchRes = await api('/api/admin/users?isActive[$ne]=true', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    boolTypeMismatchRes.status === 400,
    'Object/operator in boolean query parameter rejected with 400 Bad Request',
    `got: ${boolTypeMismatchRes.status}`
  );

  // =========================================================================
  // 6. Unknown / Extra Fields & Mass Assignment Protection
  // =========================================================================
  console.log('\n--- 6. Extra Fields & Mass Assignment Protection ---');

  // 6.1 Attempt to inject role, permissions, isAdmin in profile update
  const privEscProfileRes = await api('/api/auth/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      name: 'Legitimate Business Name',
      role: USER_ROLES.SUPER_ADMIN,
      isAdmin: true,
      isSuperAdmin: true,
      permissions: ['ALL_ACCESS', 'ROOT'],
    },
  });
  assert(
    privEscProfileRes.status === 200 || privEscProfileRes.status === 400,
    'Profile update processed safely without privilege escalation',
    `got: ${privEscProfileRes.status}`
  );
  const reloadedBizUser = await User.findById(businessUser._id);
  assert(
    reloadedBizUser.role === USER_ROLES.BUSINESS_USER && !reloadedBizUser.isAdmin && !reloadedBizUser.isSuperAdmin,
    'Database verification: Business user role remains strictly BUSINESS_USER (privilege escalation blocked)',
    `current role: ${reloadedBizUser.role}`
  );

  // 6.2 Attempt to inject verificationStatus / certificateStatus on Instrument Creation
  const privEscInstRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Counter Scale',
      manufacturer: 'Scales Corp',
      modelNumber: 'SC-99',
      serialNumber: `SC-PRIV-${Date.now()}`,
      capacity: { value: 15, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '5g',
      status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
      verificationStatus: 'VERIFIED',
      certificateStatus: 'VALID',
      installationAddress: {
        premiseName: 'Shop A',
        addressLine: 'Main St',
        city: 'City',
        district: 'District',
        state: 'State',
        pincode: '400001',
      },
    },
  });
  if (privEscInstRes.status === 201) {
    const createdId = privEscInstRes.data?.data?._id || privEscInstRes.data?._id;
    const dbInst = await Instrument.findById(createdId);
    assert(
      dbInst.status === INSTRUMENT_STATUSES.PENDING_VERIFICATION,
      'Client injection of status=ACTIVE_VERIFIED ignored; initial status forced to PENDING_VERIFICATION',
      `status: ${dbInst.status}`
    );
  } else {
    assert(
      privEscInstRes.status === 400,
      'Unauthorized status injection on instrument creation rejected with 400 Bad Request',
      `got: ${privEscInstRes.status}`
    );
  }

  // 6.3 Attempt to alter ownership / stakeholderId on instrument update
  const fakeStakeholderId = new mongoose.Types.ObjectId().toString();
  const tamperOwnershipRes = await api(`/api/instruments/${testInstrument._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      stakeholder: fakeStakeholderId,
      stakeholderId: fakeStakeholderId,
      ownership: fakeStakeholderId,
    },
  });
  assert(
    tamperOwnershipRes.status === 400 || tamperOwnershipRes.status === 403,
    'Attempt to tamper with instrument ownership/stakeholderId rejected with 400/403',
    `got: ${tamperOwnershipRes.status}`
  );

  // 6.4 Attempt to inject currentStatus / officerId in Application creation
  const privEscAppRes = await api('/api/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      instrumentId: testInstrument._id.toString(),
      currentStatus: APPLICATION_STATUSES.APPROVED,
      officerId: lmo._id.toString(),
      jurisdiction: 'ALL',
    },
  });
  assert(
    privEscAppRes.status === 400,
    'Attempt to inject protected application fields (currentStatus, officerId) rejected with 400 Bad Request',
    `got: ${privEscAppRes.status}`
  );

  // =========================================================================
  // 7. Duplicate & State Transition Validation
  // =========================================================================
  console.log('\n--- 7. Duplicate & State Transition Validation ---');

  // 7.1 Duplicate Email Registration
  const duplicateEmailRes = await api('/api/auth/register-stakeholder', {
    method: 'POST',
    body: {
      email: businessUser.email,
      password: 'StrongPassword@2026',
      name: 'Duplicate Trader',
      businessName: 'Unique Business Name Ltd',
      tradeLicenseNumber: `TL-${Date.now()}`,
      businessType: 'RETAIL',
      phone: '9876543210',
      registeredAddress: {
        street: 'Commercial Street',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        pincode: '400001',
      },
    },
  });
  assert(
    duplicateEmailRes.status === 400 || duplicateEmailRes.status === 409,
    'Duplicate email registration correctly rejected with 400/409',
    `got: ${duplicateEmailRes.status}`
  );

  // 7.2 Duplicate Instrument Serial Number for same manufacturer
  const dupSerial = testInstrument.serialNumber;
  const dupManufacturer = testInstrument.manufacturer;
  const dupInstRes = await api('/api/instruments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${bizToken}` },
    body: {
      category: INSTRUMENT_CATEGORIES.NON_AUTOMATIC_WEIGHING_INSTRUMENT,
      instrumentType: 'Electronic Scale',
      manufacturer: dupManufacturer,
      modelNumber: 'DUP-MODEL',
      serialNumber: dupSerial,
      capacity: { value: 10, unit: 'kg' },
      accuracyClass: ACCURACY_CLASSES.CLASS_III,
      verificationScaleInterval_e: '5g',
      installationAddress: {
        premiseName: 'Branch 2',
        addressLine: 'Station Road',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        pincode: '400001',
      },
    },
  });
  assert(
    dupInstRes.status === 409 || dupInstRes.status === 400,
    'Duplicate instrument (serialNumber + manufacturer) rejected with 409/400 Conflict',
    `got: ${dupInstRes.status}`
  );

  // 7.3 Invalid Status Transition: DRAFT directly to COMPLETED or APPROVED
  const draftApp = await VerificationApplication.create({
    applicationNumber: `APP-TR-${Date.now()}`,
    stakeholder: stakeholder._id,
    instrument: testInstrument._id,
    applicationType: 'NEW_VERIFICATION',
    verificationType: 'INITIAL',
    currentStatus: APPLICATION_STATUSES.DRAFT,
    verificationLocation: {
      locationType: 'ON_SITE_PREMISES',
      district: 'Mumbai City',
    },
  });

  const illegalApproveRes = await api(`/api/applications/${draftApp._id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${lmoToken}` },
    body: { remarks: 'Illegally approving draft' },
  });
  assert(
    illegalApproveRes.status === 400,
    'Illegal status transition (approving DRAFT without review) rejected with 400 Bad Request',
    `got: ${illegalApproveRes.status}`
  );

  // 7.4 Statutory Prerequisite: Attempt to generate certificate for non-existent or unfinalized inspection
  const fakeInspectionId = new mongoose.Types.ObjectId().toString();
  const certPrereqRes = await api(`/api/certificates/generate/${fakeInspectionId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${lmoToken}` },
  });
  assert(
    certPrereqRes.status === 400 || certPrereqRes.status === 404,
    'Certificate generation without valid passed inspection rejected with 400/404',
    `got: ${certPrereqRes.status}`
  );

  // =========================================================================
  // 8. Query Parameter Security & Pagination Hardening
  // =========================================================================
  console.log('\n--- 8. Query Parameter Security & Pagination Hardening ---');

  // 8.1 Prototype pollution in query parameter (__proto__)
  const protoQueryRes = await api('/api/instruments?__proto__[polluted]=true', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    protoQueryRes.status === 400,
    'Prototype pollution key (__proto__) in query parameter blocked with 400 Bad Request',
    `got: ${protoQueryRes.status}`
  );

  // 8.2 Prototype pollution in query parameter (constructor.prototype)
  const ctorQueryRes = await api('/api/instruments?constructor[prototype][polluted]=true', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    ctorQueryRes.status === 400,
    'Prototype pollution key (constructor.prototype) in query string blocked with 400 Bad Request',
    `got: ${ctorQueryRes.status}`
  );

  // 8.3 Unescaped regex metacharacters in search parameter (ReDoS / SyntaxError prevention)
  const regexSyntaxRes = await api('/api/instruments?search=((([[[***++', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    regexSyntaxRes.status === 200 || regexSyntaxRes.status === 400,
    'Unescaped regex metacharacters in search handled safely without SyntaxError/500',
    `got: ${regexSyntaxRes.status}`
  );
  verifyNoInformationLeak(regexSyntaxRes, 'Regex Search Input');

  // 8.4 Negative pagination numbers
  const negPageRes = await api('/api/instruments?page=-5&limit=-20', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  const actualPage = negPageRes.data?.data?.pagination?.page || negPageRes.data?.pagination?.page;
  const actualLimit = negPageRes.data?.data?.pagination?.limit || negPageRes.data?.pagination?.limit;
  assert(
    negPageRes.status === 200 && actualPage === 1 && actualLimit > 0,
    'Negative page and limit parameters safely clamped to positive defaults (page 1)',
    `page: ${actualPage}, limit: ${actualLimit}`
  );

  // 8.5 Extreme limit (Denial of Service prevention)
  const extremeLimitRes = await api('/api/instruments?limit=99999999', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  const clampedLimit = extremeLimitRes.data?.data?.pagination?.limit || extremeLimitRes.data?.pagination?.limit;
  assert(
    extremeLimitRes.status === 200 && clampedLimit <= 100,
    'Extreme limit (99999999) safely clamped to maximum safe limit (<= 100)',
    `limit: ${clampedLimit}`
  );

  // 8.6 Non-integer pagination parameters
  const nanPageRes = await api('/api/instruments?page=abc&limit=xyz', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  const nanActualPage = nanPageRes.data?.data?.pagination?.page || nanPageRes.data?.pagination?.page;
  assert(
    nanPageRes.status === 200 && nanActualPage === 1,
    'Non-integer pagination parameters safely fallback to default page 1',
    `page: ${nanActualPage}`
  );

  // =========================================================================
  // 9. Header & Request Body Abuse Protection
  // =========================================================================
  console.log('\n--- 9. Header & Request Body Abuse Protection ---');

  // 9.1 Malformed JSON payload
  const malformedJsonRes = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email": "test@example.com", "unclosed: json',
  });
  assert(
    malformedJsonRes.status === 400,
    'Malformed JSON payload rejected with 400 Bad Request (not 500)',
    `got: ${malformedJsonRes.status}`
  );
  verifyNoInformationLeak(malformedJsonRes, 'Malformed JSON');

  // 9.2 Unexpected Content-Type with raw payload
  const badContentTypeRes = await api('/api/instruments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bizToken}`,
      'Content-Type': 'application/x-bogus-format',
    },
    body: 'Random unparsed payload bytes 0x00 0xFF',
  });
  assert(
    badContentTypeRes.status === 400 || badContentTypeRes.status === 415 || badContentTypeRes.status === 200,
    'Unexpected Content-Type header handled safely without server crash',
    `got: ${badContentTypeRes.status}`
  );
  verifyNoInformationLeak(badContentTypeRes, 'Unexpected Content-Type');

  // =========================================================================
  // 10. Security Regression & Valid Operation Verification
  // =========================================================================
  console.log('\n--- 10. Security Regression & Valid Workflow Verification ---');

  // 10.1 Legitimate business operation: Fetch user profile
  const validProfileRes = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  const userEmail = validProfileRes.data?.data?.user?.email || validProfileRes.data?.data?.email;
  assert(
    validProfileRes.status === 200 && userEmail === businessUser.email,
    'Regression check: Legitimate user profile retrieval functions 100% normally',
    `email: ${userEmail}`
  );

  // 10.2 Legitimate business operation: List user instruments
  const validInstListRes = await api('/api/instruments', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  const instList = validInstListRes.data?.data?.instruments || validInstListRes.data?.data?.items || validInstListRes.data?.items;
  assert(
    validInstListRes.status === 200 && Array.isArray(instList),
    'Regression check: Legitimate instrument list retrieval functions 100% normally',
    `count: ${instList ? instList.length : 0}`
  );

  // 10.3 RBAC preservation: Business user cannot access Super Admin endpoints
  const rbacAdminRes = await api('/api/admin/users', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    rbacAdminRes.status === 403,
    'Regression check: Business user strictly forbidden from admin endpoints (RBAC intact)',
    `got: ${rbacAdminRes.status}`
  );

  // 10.4 RBAC preservation: Field Verification Officer cannot approve applications
  const rbacFvoApproveRes = await api(`/api/applications/${draftApp._id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${fvoToken}` },
    body: { remarks: 'FVO attempt' },
  });
  assert(
    rbacFvoApproveRes.status === 403,
    'Regression check: Field Officer cannot perform LMO-only application approval (RBAC intact)',
    `got: ${rbacFvoApproveRes.status}`
  );

  // Clean up temporary draft application
  await VerificationApplication.findByIdAndDelete(draftApp._id);

  console.log('\n========================================================================');
  console.log('📊 TASK 3 TEST SUITE EXECUTION SUMMARY');
  console.log('========================================================================');
  console.log(`TOTAL TESTS EXECUTED : ${passed + failed}`);
  console.log(`✅ TOTAL PASSED       : ${passed}`);
  console.log(`❌ TOTAL FAILED       : ${failed}`);
  console.log(`🎯 PASS RATE          : ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.error('\nDetailed Failures:');
    failureDetails.forEach((d) => console.error(d));
  }
  console.log('========================================================================\n');

  await disconnectDB();

  if (failed > 0) {
    process.exit(1);
  }
}

runInputSecurityTests().catch((err) => {
  console.error('Fatal error executing Task 3 Input Security Test Suite:', err);
  process.exit(1);
});
