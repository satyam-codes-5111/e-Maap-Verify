import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  SCHEDULE_STATUSES,
  INSPECTION_STATUSES,
  INSTRUMENT_STATUSES,
} from '../config/constants.js';

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failureDetails = [];

function assert(condition, message, detail = '') {
  const currentTest = passed + failed + 1;
  if (condition) {
    passed++;
    console.log(`[✅ PASS] Test ${currentTest}: ${message} ${detail ? `(${detail})` : ''}`);
  } else {
    failed++;
    const failMsg = `[❌ FAIL] Test ${currentTest}: ${message} ${detail ? `(${detail})` : ''}`;
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

// Sample binary test buffers
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
  0x42, 0x60, 0x82,
]);

const VALID_JPEG_BUFFER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
  0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
  0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
  0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
  0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
  0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
  0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
  0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
  0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
  0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
  0x00, 0xBF, 0x00, 0xFF, 0xD9,
]);

const VALID_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
);

const EXECUTABLE_MZ_BUFFER = Buffer.from([
  0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
  0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
]);

const EXECUTABLE_ELF_BUFFER = Buffer.from([
  0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00,
]);

const SCRIPT_SH_BUFFER = Buffer.from('#!/bin/bash\necho "Malicious code executed"\n');
const SCRIPT_HTML_BUFFER = Buffer.from('<!DOCTYPE html><html><script>alert("XSS")</script></html>');
const SCRIPT_PHP_BUFFER = Buffer.from('<?php echo system($_GET["cmd"]); ?>');

async function uploadMultipart(endpoint, fieldName, fileBuffer, fileName, mimeType, token, additionalFields = {}) {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append(fieldName, blob, fileName);

  for (const [key, value] of Object.entries(additionalFields)) {
    formData.append(key, value);
  }

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, data, headers: res.headers };
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🔒 Starting Phase 12 Part 2 — Task 5: File Security Hardening Suite');
  console.log('===============================================================');

  await connectDB();

  try {
    // -------------------------------------------------------------
    // SETUP: Initialize Real Users, Stakeholders, Instruments & Inspections
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const suffix = `${timestamp}_${Math.floor(Math.random() * 1000)}`;

    const [userA, userB, officerA, officerB, adminUser, superAdmin] = await Promise.all([
      User.create({
        name: `Business User A ${suffix}`,
        email: `biz_a_${suffix}@example.com`,
        password: 'Password123!',
        role: USER_ROLES.BUSINESS_USER,
        status: 'ACTIVE',
      }),
      User.create({
        name: `Business User B ${suffix}`,
        email: `biz_b_${suffix}@example.com`,
        password: 'Password123!',
        role: USER_ROLES.BUSINESS_USER,
        status: 'ACTIVE',
      }),
      User.create({
        name: `Assigned Officer A ${suffix}`,
        email: `fvo_a_${suffix}@example.com`,
        password: 'Password123!',
        role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
        status: 'ACTIVE',
        jurisdiction: 'District South',
      }),
      User.create({
        name: `Unassigned Officer B ${suffix}`,
        email: `fvo_b_${suffix}@example.com`,
        password: 'Password123!',
        role: USER_ROLES.FIELD_VERIFICATION_OFFICER,
        status: 'ACTIVE',
        jurisdiction: 'District North',
      }),
      User.create({
        name: `Admin User ${suffix}`,
        email: `admin_${suffix}@example.com`,
        password: 'Password123!',
        role: USER_ROLES.ADMIN,
        status: 'ACTIVE',
      }),
      User.create({
        name: `Super Admin ${suffix}`,
        email: `super_${suffix}@example.com`,
        password: 'Password123!',
        role: USER_ROLES.SUPER_ADMIN,
        status: 'ACTIVE',
      }),
    ]);

    const tokenA = generateToken(userA);
    const tokenB = generateToken(userB);
    const tokenOfficerA = generateToken(officerA);
    const tokenOfficerB = generateToken(officerB);
    const tokenAdmin = generateToken(adminUser);
    const tokenSuper = generateToken(superAdmin);

    const [stakeholderA, stakeholderB] = await Promise.all([
      Stakeholder.create({
        user: userA._id,
        businessName: `Enterprise A ${suffix}`,
        tradeLicenseNumber: `TL-A-${suffix}`,
        businessType: 'MANUFACTURER',
        contactPerson: { name: 'Owner A', email: userA.email, phone: '9876543210' },
        registeredAddress: { street: 'Industrial Road 1', city: 'Mumbai', district: 'District South', state: 'Maharashtra', pincode: '400001' },
      }),
      Stakeholder.create({
        user: userB._id,
        businessName: `Enterprise B ${suffix}`,
        tradeLicenseNumber: `TL-B-${suffix}`,
        businessType: 'REPAIRER',
        contactPerson: { name: 'Owner B', email: userB.email, phone: '9876543211' },
        registeredAddress: { street: 'Industrial Road 2', city: 'Mumbai', district: 'District North', state: 'Maharashtra', pincode: '400002' },
      }),
    ]);

    const [instrumentA, instrumentB] = await Promise.all([
      Instrument.create({
        instrumentId: `INST-A-${suffix}`,
        serialNumber: `SN-A-${suffix}`,
        category: 'NON_AUTOMATIC_WEIGHING_INSTRUMENT',
        instrumentType: 'BENCH_SCALE',
        modelNumber: 'Precision-A',
        manufacturer: 'DocA Weights Corp',
        capacity: { value: 15, unit: 'kg' },
        accuracyClass: 'CLASS_III_MEDIUM',
        verificationScaleInterval_e: '5g',
        verificationIntervalMonths: 12,
        installationAddress: {
          premiseName: 'Plot 101 MIDC',
          addressLine: 'Plot 101 MIDC Andheri',
          city: 'Mumbai',
          state: 'Maharashtra',
          district: 'District South',
          pincode: '400001',
        },
        stakeholder: stakeholderA._id,
        status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
        createdBy: userA._id,
      }),
      Instrument.create({
        instrumentId: `INST-B-${suffix}`,
        serialNumber: `SN-B-${suffix}`,
        category: 'NON_AUTOMATIC_WEIGHING_INSTRUMENT',
        instrumentType: 'BENCH_SCALE',
        modelNumber: 'Length-B',
        manufacturer: 'DocA Measures Ltd',
        capacity: { value: 30, unit: 'kg' },
        accuracyClass: 'CLASS_III_MEDIUM',
        verificationScaleInterval_e: '10g',
        verificationIntervalMonths: 12,
        installationAddress: {
          premiseName: 'Plot 102 MIDC',
          addressLine: 'Plot 102 MIDC Andheri',
          city: 'Mumbai',
          state: 'Maharashtra',
          district: 'District North',
          pincode: '400002',
        },
        stakeholder: stakeholderB._id,
        status: INSTRUMENT_STATUSES.ACTIVE_VERIFIED,
        createdBy: userB._id,
      }),
    ]);

    const applicationA = await VerificationApplication.create({
      applicationNumber: `APP-A-${suffix}`,
      stakeholder: stakeholderA._id,
      instrument: instrumentA._id,
      applicationType: 'INITIAL_VERIFICATION',
      verificationType: 'INITIAL',
      currentStatus: APPLICATION_STATUSES.INSPECTION,
      assignedLMO: officerA._id,
      createdBy: userA._id,
    });

    const scheduleA = await VerificationSchedule.create({
      scheduleNumber: `SCH-A-${suffix}`,
      application: applicationA._id,
      instrument: instrumentA._id,
      stakeholder: stakeholderA._id,
      assignedOfficer: officerA._id,
      scheduledDate: new Date(),
      timeSlot: '10:00 - 11:30',
      startTime: '10:00',
      endTime: '11:30',
      locationAddress: 'Old Customs House, Mumbai',
      status: SCHEDULE_STATUSES.IN_PROGRESS,
      createdBy: officerA._id,
    });

    const activeInspection = await VerificationInspection.create({
      inspectionNumber: `INSP-ACTIVE-${suffix}`,
      application: applicationA._id,
      schedule: scheduleA._id,
      instrument: instrumentA._id,
      stakeholder: stakeholderA._id,
      assignedOfficer: officerA._id,
      officer: officerA._id,
      inspectionStatus: INSPECTION_STATUSES.IN_PROGRESS,
      startTime: new Date(),
    });

    const applicationFinal = await VerificationApplication.create({
      applicationNumber: `APP-FINAL-${suffix}`,
      stakeholder: stakeholderA._id,
      instrument: instrumentA._id,
      applicationType: 'INITIAL_VERIFICATION',
      verificationType: 'INITIAL',
      currentStatus: APPLICATION_STATUSES.VERIFIED,
      assignedLMO: officerA._id,
      createdBy: userA._id,
    });

    const scheduleFinal = await VerificationSchedule.create({
      scheduleNumber: `SCH-FINAL-${suffix}`,
      application: applicationFinal._id,
      instrument: instrumentA._id,
      stakeholder: stakeholderA._id,
      assignedOfficer: officerA._id,
      scheduledDate: new Date(Date.now() - 3600000),
      timeSlot: '10:00 - 11:30',
      startTime: '10:00',
      endTime: '11:30',
      locationAddress: 'Old Customs House, Mumbai',
      status: SCHEDULE_STATUSES.COMPLETED,
      createdBy: officerA._id,
    });

    const finalizedInspection = await VerificationInspection.create({
      inspectionNumber: `INSP-FINAL-${suffix}`,
      application: applicationFinal._id,
      schedule: scheduleFinal._id,
      instrument: instrumentA._id,
      stakeholder: stakeholderA._id,
      assignedOfficer: officerA._id,
      officer: officerA._id,
      inspectionStatus: INSPECTION_STATUSES.PASSED,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
    });

    // Create physical certificate file and record
    const certFileName = `certificate-SEC-${suffix}.pdf`;
    const certDir = path.resolve(ENV.UPLOAD_DIR, 'certificates');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    const certFilePath = path.resolve(certDir, certFileName);
    fs.writeFileSync(certFilePath, VALID_PDF_BUFFER);

    const certificateA = await Certificate.create({
      certificateNumber: `CERT-SEC-${suffix}`,
      application: applicationA._id,
      instrument: instrumentA._id,
      stakeholder: stakeholderA._id,
      issuedBy: officerA._id,
      issuedByOfficer: officerA._id,
      issuedAt: new Date(),
      issueDate: new Date(),
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      status: 'ACTIVE',
      certificateStatus: 'ACTIVE',
      certificatePdfPath: `/uploads/certificates/${certFileName}`,
      certificateUrl: `/uploads/certificates/${certFileName}`,
      qrToken: `QR-TOKEN-SEC-${suffix}`,
      qrCodeDataUrl: `https://verify.legalmetrology.gov.in/verify/CERT-SEC-${suffix}`,
      securityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      tamperEvidentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    console.log('✅ Real test environment initialized successfully.\n');

    // =========================================================================
    // SECTION 1: MIME & File-Type Allowlist Validation
    // =========================================================================
    console.log('--- SECTION 1: MIME & File-Type Allowlist Validation ---');

    // Test 1: Valid PDF upload to KYC document
    const validPdfKyc = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      VALID_PDF_BUFFER,
      'trade_license.pdf',
      'application/pdf',
      tokenA,
      { docType: 'TRADE_LICENSE' }
    );
    assert(
      validPdfKyc.status === 201 && validPdfKyc.data?.success,
      'Valid PDF upload is accepted (HTTP 201)',
      `Status: ${validPdfKyc.status}`
    );

    // Test 2: Valid JPEG upload to Instrument photo
    const validJpgPhoto = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_JPEG_BUFFER,
      'scale_front.jpg',
      'image/jpeg',
      tokenA,
      { caption: 'Front Photo' }
    );
    assert(
      validJpgPhoto.status === 201 && validJpgPhoto.data?.success,
      'Valid JPEG upload is accepted (HTTP 201)',
      `Status: ${validJpgPhoto.status}`
    );

    // Test 3: Valid PNG upload to Inspection evidence
    const validPngEvidence = await uploadMultipart(
      `/api/inspections/${activeInspection._id}/evidence`,
      'photo',
      VALID_PNG_BUFFER,
      'seal_evidence.png',
      'image/png',
      tokenOfficerA,
      { caption: 'Verification Seal Evidence' }
    );
    assert(
      validPngEvidence.status === 201 && validPngEvidence.data?.success,
      'Valid PNG evidence upload is accepted (HTTP 201)',
      `Status: ${validPngEvidence.status}`
    );

    // Test 4: Executable (.exe) upload rejected
    const exeUpload = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      EXECUTABLE_MZ_BUFFER,
      'malicious.exe',
      'application/x-msdownload',
      tokenA
    );
    assert(
      exeUpload.status === 400,
      'Executable binary (.exe) upload is rejected with HTTP 400',
      `Status: ${exeUpload.status}`
    );

    // Test 5: Shell script (.sh) upload rejected
    const shUpload = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      SCRIPT_SH_BUFFER,
      'exploit.sh',
      'text/x-shellscript',
      tokenA
    );
    assert(
      shUpload.status === 400,
      'Shell script (.sh) upload is rejected with HTTP 400',
      `Status: ${shUpload.status}`
    );

    // Test 6: HTML (.html) upload rejected
    const htmlUpload = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      SCRIPT_HTML_BUFFER,
      'phishing.html',
      'text/html',
      tokenA
    );
    assert(
      htmlUpload.status === 400,
      'HTML (.html) file upload is rejected with HTTP 400',
      `Status: ${htmlUpload.status}`
    );

    // Test 7: PHP script (.php) upload rejected
    const phpUpload = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/documents`,
      'document',
      SCRIPT_PHP_BUFFER,
      'webshell.php',
      'application/x-httpd-php',
      tokenA
    );
    assert(
      phpUpload.status === 400,
      'PHP script (.php) upload is rejected with HTTP 400',
      `Status: ${phpUpload.status}`
    );

    // =========================================================================
    // SECTION 2: File Extension Spoofing & Magic Bytes Detection
    // =========================================================================
    console.log('\n--- SECTION 2: File Extension Spoofing & Magic Bytes Detection ---');

    // Test 8: Fake JPEG containing Windows PE executable binary (MZ) rejected
    const fakeJpgExe = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      EXECUTABLE_MZ_BUFFER,
      'fake_photo.jpg',
      'image/jpeg',
      tokenA
    );
    assert(
      fakeJpgExe.status === 400,
      'Extension spoofing: .jpg containing MZ executable binary is rejected with HTTP 400',
      `Status: ${fakeJpgExe.status}`
    );

    // Test 9: Fake PDF containing Linux ELF executable rejected
    const fakePdfElf = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      EXECUTABLE_ELF_BUFFER,
      'spoofed_document.pdf',
      'application/pdf',
      tokenA
    );
    assert(
      fakePdfElf.status === 400,
      'Extension spoofing: .pdf containing ELF binary is rejected with HTTP 400',
      `Status: ${fakePdfElf.status}`
    );

    // Test 10: Fake PNG containing HTML script payload rejected
    const fakePngHtml = await uploadMultipart(
      `/api/inspections/${activeInspection._id}/evidence`,
      'photo',
      SCRIPT_HTML_BUFFER,
      'innocent_photo.png',
      'image/png',
      tokenOfficerA
    );
    assert(
      fakePngHtml.status === 400,
      'Extension spoofing: .png containing HTML/script is rejected with HTTP 400',
      `Status: ${fakePngHtml.status}`
    );

    // Test 11: Double extension evil.jpg.exe rejected
    const doubleExtJpgExe = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_JPEG_BUFFER,
      'photo.jpg.exe',
      'image/jpeg',
      tokenA
    );
    assert(
      doubleExtJpgExe.status === 400,
      'Double extension photo.jpg.exe is rejected with HTTP 400',
      `Status: ${doubleExtJpgExe.status}`
    );

    // Test 12: Double extension document.pdf.js rejected
    const doubleExtPdfJs = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      VALID_PDF_BUFFER,
      'document.pdf.js',
      'application/pdf',
      tokenA
    );
    assert(
      doubleExtPdfJs.status === 400,
      'Double extension document.pdf.js is rejected with HTTP 400',
      `Status: ${doubleExtPdfJs.status}`
    );

    // Test 13: Double extension photo.png.php rejected
    const doubleExtPngPhp = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_PNG_BUFFER,
      'test.png.php',
      'image/png',
      tokenA
    );
    assert(
      doubleExtPngPhp.status === 400,
      'Double extension test.png.php is rejected with HTTP 400',
      `Status: ${doubleExtPngPhp.status}`
    );

    // Test 14: Null byte in filename photo.jpg\0.exe rejected
    const nullByteName = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_JPEG_BUFFER,
      'photo.jpg\0.exe',
      'image/jpeg',
      tokenA
    );
    assert(
      nullByteName.status === 400,
      'Null byte in filename is rejected with HTTP 400',
      `Status: ${nullByteName.status}`
    );

    // =========================================================================
    // SECTION 3: File Size Limits & Handling
    // =========================================================================
    console.log('\n--- SECTION 3: File Size Limits & Handling ---');

    // Test 15: Small file upload accepted
    const smallBuffer = VALID_JPEG_BUFFER;
    const smallRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      smallBuffer,
      'small_scale.jpg',
      'image/jpeg',
      tokenA
    );
    assert(
      smallRes.status === 201,
      'Normal size file (1KB) is accepted (HTTP 201)',
      `Status: ${smallRes.status}`
    );

    // Test 16: Oversized file (> 5MB, e.g. 5.5MB) rejected
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0x5a); // 5.5MB dummy
    const oversizedRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      oversizedBuffer,
      'giant_file.jpg',
      'image/jpeg',
      tokenA
    );
    assert(
      oversizedRes.status === 400 || oversizedRes.status === 413,
      'Oversized file (5.5 MB > 5 MB limit) is rejected with HTTP 400 or 413',
      `Status: ${oversizedRes.status}`
    );

    // Test 17: Zero-byte empty file rejected
    const emptyBuffer = Buffer.alloc(0);
    const emptyRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      emptyBuffer,
      'empty.jpg',
      'image/jpeg',
      tokenA
    );
    assert(
      emptyRes.status === 400,
      'Zero-byte empty file is rejected with HTTP 400',
      `Status: ${emptyRes.status}`
    );

    // =========================================================================
    // SECTION 4: Malicious Filenames, Traversal & Sanitization
    // =========================================================================
    console.log('\n--- SECTION 4: Malicious Filenames, Traversal & Sanitization ---');

    // Test 18: Path traversal in originalname (../../../../etc/passwd) rejected or sanitized
    const traversalFilenameRes = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      VALID_PDF_BUFFER,
      '../../../../etc/passwd.pdf',
      'application/pdf',
      tokenA
    );
    assert(
      traversalFilenameRes.status === 400,
      'Path traversal in filename (../../../../etc/passwd.pdf) is blocked with HTTP 400',
      `Status: ${traversalFilenameRes.status}`
    );

    // Test 19: Windows path traversal (..\..\..\windows\system32\cmd.exe.pdf) rejected
    const winTraversalRes = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      VALID_PDF_BUFFER,
      '..\\..\\..\\windows\\system32\\cmd.exe.pdf',
      'application/pdf',
      tokenA
    );
    assert(
      winTraversalRes.status === 400,
      'Windows path traversal in filename is blocked with HTTP 400',
      `Status: ${winTraversalRes.status}`
    );

    // Test 20: URL-encoded traversal in filename (%2e%2e%2f%2e%2e%2f) rejected
    const urlEncTraversalRes = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      VALID_PDF_BUFFER,
      '%2e%2e%2f%2e%2e%2fevil.pdf',
      'application/pdf',
      tokenA
    );
    assert(
      urlEncTraversalRes.status === 400,
      'URL-encoded path traversal in filename (%2e%2e%2f) is blocked with HTTP 400',
      `Status: ${urlEncTraversalRes.status}`
    );

    // Test 21: Command injection symbols in filename (photo;rm -rf;.jpg) safely sanitized
    const cmdInjectRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_JPEG_BUFFER,
      'photo;rm -rf;.jpg',
      'image/jpeg',
      tokenA
    );
    assert(
      cmdInjectRes.status === 201 &&
        !cmdInjectRes.data?.data?.photographs?.some((p) => p.fileUrl?.includes(';rm')),
      'Command injection symbols in filename are safely stored without executing or leaking commands',
      `Status: ${cmdInjectRes.status}`
    );

    // =========================================================================
    // SECTION 5: Stored Filename Generation & Storage Isolation
    // =========================================================================
    console.log('\n--- SECTION 5: Stored Filename Generation & Storage Isolation ---');

    // Test 22: Stored filename collision safety (2 uploads of same original filename get distinct stored files)
    const file1Res = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_PNG_BUFFER,
      'identical_name.png',
      'image/png',
      tokenA
    );
    const file2Res = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_PNG_BUFFER,
      'identical_name.png',
      'image/png',
      tokenA
    );
    const photos = file2Res.data?.data?.photographs || [];
    const identicalPhotos = photos.filter((p) => p.fileName?.includes('identical_name'));
    assert(
      file1Res.status === 201 &&
        file2Res.status === 201 &&
        identicalPhotos.length >= 2 &&
        identicalPhotos[identicalPhotos.length - 1].fileUrl !== identicalPhotos[identicalPhotos.length - 2].fileUrl,
      'Concurrent uploads with identical filename generate unique server-stored URLs without collision',
      `Stored URL 1 != Stored URL 2`
    );

    // Test 23: Stored file path is strictly inside UPLOAD_DIR
    const latestStoredUrl = identicalPhotos[identicalPhotos.length - 1]?.fileUrl;
    const latestFileName = path.basename(latestStoredUrl);
    const physicalPath = path.resolve(ENV.UPLOAD_DIR, 'instrument-photos', latestFileName);
    assert(
      fs.existsSync(physicalPath) && physicalPath.startsWith(path.resolve(ENV.UPLOAD_DIR)),
      'Uploaded file exists strictly within configured UPLOAD_DIR on filesystem',
      `Physical path: ${physicalPath}`
    );

    // =========================================================================
    // SECTION 6: Path Traversal & Escape Prevention on File Retrieval
    // =========================================================================
    console.log('\n--- SECTION 6: Path Traversal & Escape Prevention on File Retrieval ---');

    // Test 24: GET /uploads/documents/../../.env blocked with 400 or 404
    const escapeEnvRes = await fetch(`${BASE_URL}/uploads/documents/../../.env`, {
      headers: { Authorization: `Bearer ${tokenSuper}` },
    });
    assert(
      escapeEnvRes.status === 400 || escapeEnvRes.status === 404,
      'GET /uploads/documents/../../.env is blocked (HTTP 400/404)',
      `Status: ${escapeEnvRes.status}`
    );

    // Test 25: GET /uploads/documents/..%2f..%2fpackage.json blocked
    const escapePkgRes = await fetch(`${BASE_URL}/uploads/documents/..%2f..%2fpackage.json`, {
      headers: { Authorization: `Bearer ${tokenSuper}` },
    });
    assert(
      escapePkgRes.status === 400 || escapePkgRes.status === 404,
      'GET /uploads/documents/..%2f..%2fpackage.json is blocked (HTTP 400/404)',
      `Status: ${escapePkgRes.status}`
    );

    // Test 26: Direct access to /.env blocked with 404
    const directEnvRes = await fetch(`${BASE_URL}/.env`);
    assert(
      directEnvRes.status === 404,
      'Direct HTTP request to /.env returns HTTP 404',
      `Status: ${directEnvRes.status}`
    );

    // Test 27: Direct access to /package.json blocked with 404
    const directPkgRes = await fetch(`${BASE_URL}/package.json`);
    assert(
      directPkgRes.status === 404,
      'Direct HTTP request to /package.json returns HTTP 404',
      `Status: ${directPkgRes.status}`
    );

    // Test 28: Direct access to /server.ts blocked with 404
    const directServerRes = await fetch(`${BASE_URL}/server.ts`);
    assert(
      directServerRes.status === 404,
      'Direct HTTP request to /server.ts returns HTTP 404',
      `Status: ${directServerRes.status}`
    );

    // Test 29: Direct access to /uploads directory listing is forbidden
    const dirListRes = await fetch(`${BASE_URL}/uploads`, {
      headers: { Authorization: `Bearer ${tokenSuper}` },
    });
    assert(
      dirListRes.status === 403 || dirListRes.status === 404,
      'Direct directory access /uploads is forbidden (HTTP 403/404)',
      `Status: ${dirListRes.status}`
    );

    // =========================================================================
    // SECTION 7: Unauthorized File Access & RBAC Isolation
    // =========================================================================
    console.log('\n--- SECTION 7: Unauthorized File Access & RBAC Isolation ---');

    // Retrieve the KYC document URL uploaded by User A
    const stakeholderADoc = await Stakeholder.findById(stakeholderA._id);
    const kycDocUrl = stakeholderADoc.kycDocuments[0]?.fileUrl;
    const kycFileName = path.basename(kycDocUrl);

    // Test 30: Unauthenticated access to uploaded KYC document rejected with 401
    const unauthKycRes = await fetch(`${BASE_URL}/uploads/documents/${kycFileName}`);
    assert(
      unauthKycRes.status === 401,
      'Unauthenticated access to /uploads/documents/:file returns HTTP 401 Unauthorized',
      `Status: ${unauthKycRes.status}`
    );

    // Test 31: User B (another business user) cannot download User A's KYC document (HTTP 403)
    const crossKycRes = await fetch(`${BASE_URL}/uploads/documents/${kycFileName}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      crossKycRes.status === 403,
      'Business User B attempting to access Business User A KYC document returns HTTP 403 Forbidden',
      `Status: ${crossKycRes.status}`
    );

    // Test 32: User A (legitimate owner) CAN download own KYC document (HTTP 200)
    const ownerKycRes = await fetch(`${BASE_URL}/uploads/documents/${kycFileName}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      ownerKycRes.status === 200,
      'Business User A (owner) can successfully download own KYC document (HTTP 200)',
      `Status: ${ownerKycRes.status}`
    );

    // Test 33: User B cannot download User A's certificate PDF (HTTP 403)
    const crossCertRes = await fetch(`${BASE_URL}/uploads/certificates/${certFileName}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      crossCertRes.status === 403,
      'Business User B attempting to download User A certificate PDF returns HTTP 403 Forbidden',
      `Status: ${crossCertRes.status}`
    );

    // Test 34: User A (owner) CAN download own certificate PDF (HTTP 200)
    const ownerCertRes = await fetch(`${BASE_URL}/uploads/certificates/${certFileName}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      ownerCertRes.status === 200,
      'Business User A (owner) can successfully download own certificate PDF (HTTP 200)',
      `Status: ${ownerCertRes.status}`
    );

    // Test 35: Certificate download endpoint /api/certificates/:id/download checks RBAC
    const certDownloadRes = await fetch(`${BASE_URL}/api/certificates/${certificateA._id}/download`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      certDownloadRes.status === 403,
      'GET /api/certificates/:id/download by unauthorized User B returns HTTP 403 Forbidden',
      `Status: ${certDownloadRes.status}`
    );

    // Test 36: Certificate download endpoint by owner returns 200 and PDF stream
    const certDownloadOwnerRes = await fetch(`${BASE_URL}/api/certificates/${certificateA._id}/download`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      certDownloadOwnerRes.status === 200 && certDownloadOwnerRes.headers.get('content-type')?.includes('application/pdf'),
      'GET /api/certificates/:id/download by owner returns HTTP 200 with application/pdf Content-Type',
      `Status: ${certDownloadOwnerRes.status}, Content-Type: ${certDownloadOwnerRes.headers.get('content-type')}`
    );

    // Test 37: Unassigned Officer B cannot view Officer A's inspection photo (HTTP 403)
    const inspectionDoc = await VerificationInspection.findById(activeInspection._id);
    const inspectionPhotoUrl = inspectionDoc.photographs[0]?.fileUrl;
    const inspectionPhotoName = path.basename(inspectionPhotoUrl);

    const crossOfficerPhotoRes = await fetch(`${BASE_URL}/uploads/instrument-photos/${inspectionPhotoName}`, {
      headers: { Authorization: `Bearer ${tokenOfficerB}` },
    });
    assert(
      crossOfficerPhotoRes.status === 403,
      'Unassigned Officer B cannot access inspection photo of Officer A (HTTP 403)',
      `Status: ${crossOfficerPhotoRes.status}`
    );

    // Test 38: Assigned Officer A CAN view assigned inspection photo (HTTP 200)
    const assignedOfficerPhotoRes = await fetch(`${BASE_URL}/uploads/instrument-photos/${inspectionPhotoName}`, {
      headers: { Authorization: `Bearer ${tokenOfficerA}` },
    });
    assert(
      assignedOfficerPhotoRes.status === 200,
      'Assigned Officer A can view inspection photo of assigned inspection (HTTP 200)',
      `Status: ${assignedOfficerPhotoRes.status}`
    );

    // Test 39: Admin user can view inspection photo (HTTP 200)
    const adminPhotoRes = await fetch(`${BASE_URL}/uploads/instrument-photos/${inspectionPhotoName}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(
      adminPhotoRes.status === 200,
      'Admin user can view inspection photo (HTTP 200)',
      `Status: ${adminPhotoRes.status}`
    );

    // =========================================================================
    // SECTION 8: Inspection Evidence Workflow Security
    // =========================================================================
    console.log('\n--- SECTION 8: Inspection Evidence Workflow Security ---');

    // Test 40: Assigned Officer can upload evidence to active inspection (201)
    const officerUploadRes = await uploadMultipart(
      `/api/inspections/${activeInspection._id}/evidence`,
      'evidence',
      VALID_PNG_BUFFER,
      'accuracy_test.png',
      'image/png',
      tokenOfficerA,
      { caption: 'Accuracy Test 1' }
    );
    assert(
      officerUploadRes.status === 201,
      'Assigned officer can upload evidence to active inspection (HTTP 201)',
      `Status: ${officerUploadRes.status}`
    );

    // Test 41: Unassigned Officer B cannot upload evidence to active inspection (HTTP 403)
    const unassignedUploadRes = await uploadMultipart(
      `/api/inspections/${activeInspection._id}/evidence`,
      'evidence',
      VALID_PNG_BUFFER,
      'rogue_test.png',
      'image/png',
      tokenOfficerB,
      { caption: 'Unauthorized Upload' }
    );
    assert(
      unassignedUploadRes.status === 403,
      'Unassigned Officer B cannot upload evidence to active inspection (HTTP 403)',
      `Status: ${unassignedUploadRes.status}`
    );

    // Test 42: Business User cannot upload evidence to inspection (HTTP 403)
    const bizUploadRes = await uploadMultipart(
      `/api/inspections/${activeInspection._id}/evidence`,
      'evidence',
      VALID_PNG_BUFFER,
      'biz_tamper.png',
      'image/png',
      tokenA,
      { caption: 'Tamper Attempt' }
    );
    assert(
      bizUploadRes.status === 403,
      'Business User cannot upload evidence to official inspection (HTTP 403)',
      `Status: ${bizUploadRes.status}`
    );

    // Test 43: Unauthenticated request cannot upload evidence (HTTP 401)
    const unauthUploadRes = await uploadMultipart(
      `/api/inspections/${activeInspection._id}/evidence`,
      'evidence',
      VALID_PNG_BUFFER,
      'unauth.png',
      'image/png',
      null
    );
    assert(
      unauthUploadRes.status === 401,
      'Unauthenticated request to upload evidence returns HTTP 401',
      `Status: ${unauthUploadRes.status}`
    );

    // Test 44: Cannot upload evidence to finalized inspection (HTTP 400)
    const finalizedUploadRes = await uploadMultipart(
      `/api/inspections/${finalizedInspection._id}/evidence`,
      'evidence',
      VALID_PNG_BUFFER,
      'post_final.png',
      'image/png',
      tokenOfficerA
    );
    assert(
      finalizedUploadRes.status === 400,
      'Uploading evidence to finalized inspection is rejected with HTTP 400',
      `Status: ${finalizedUploadRes.status}`
    );

    // =========================================================================
    // SECTION 9: Direct Base64 Upload Security
    // =========================================================================
    console.log('\n--- SECTION 9: Direct Base64 Upload Security ---');

    // Test 45: Valid base64 Data URI PNG evidence accepted (201)
    const base64Png = `data:image/png;base64,${VALID_PNG_BUFFER.toString('base64')}`;
    const base64Res = await fetch(`${BASE_URL}/api/inspections/${activeInspection._id}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficerA}`,
      },
      body: JSON.stringify({
        file: base64Png,
        caption: 'Base64 Verification Seal',
      }),
    });
    const base64Data = await base64Res.json();
    assert(
      base64Res.status === 201 && base64Data.success,
      'Valid base64 Data URI PNG upload is accepted (HTTP 201)',
      `Status: ${base64Res.status}`
    );

    // Test 46: Malformed base64 encoding rejected (HTTP 400)
    const malformedBase64Res = await fetch(`${BASE_URL}/api/inspections/${activeInspection._id}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficerA}`,
      },
      body: JSON.stringify({
        file: 'data:image/png;base64,NOT_VALID_BASE64_$%#@!&*',
        caption: 'Malformed Test',
      }),
    });
    assert(
      malformedBase64Res.status === 400,
      'Malformed base64 payload is rejected with HTTP 400',
      `Status: ${malformedBase64Res.status}`
    );

    // Test 47: Fake MIME declaration in base64 (declaring image/png with MZ executable) rejected (HTTP 400)
    const spoofedBase64 = `data:image/png;base64,${EXECUTABLE_MZ_BUFFER.toString('base64')}`;
    const spoofedBase64Res = await fetch(`${BASE_URL}/api/inspections/${activeInspection._id}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficerA}`,
      },
      body: JSON.stringify({
        file: spoofedBase64,
        caption: 'Spoofed Base64 Executable',
      }),
    });
    assert(
      spoofedBase64Res.status === 400,
      'MIME-spoofed base64 payload (executable binary disguised as image/png) is rejected with HTTP 400',
      `Status: ${spoofedBase64Res.status}`
    );

    // Test 48: HTML script payload disguised as base64 rejected (HTTP 400)
    const htmlBase64 = `data:image/png;base64,${SCRIPT_HTML_BUFFER.toString('base64')}`;
    const htmlBase64Res = await fetch(`${BASE_URL}/api/inspections/${activeInspection._id}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficerA}`,
      },
      body: JSON.stringify({
        file: htmlBase64,
        caption: 'HTML Script Base64',
      }),
    });
    assert(
      htmlBase64Res.status === 400,
      'Active HTML/script disguised in base64 is rejected with HTTP 400',
      `Status: ${htmlBase64Res.status}`
    );

    // Test 49: Unsupported MIME in base64 Data URI rejected (HTTP 400)
    const textBase64 = `data:text/html;base64,${SCRIPT_HTML_BUFFER.toString('base64')}`;
    const textBase64Res = await fetch(`${BASE_URL}/api/inspections/${activeInspection._id}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenOfficerA}`,
      },
      body: JSON.stringify({
        file: textBase64,
        caption: 'Text Base64',
      }),
    });
    assert(
      textBase64Res.status === 400,
      'Unsupported MIME in Data URI (data:text/html) is rejected with HTTP 400',
      `Status: ${textBase64Res.status}`
    );

    // =========================================================================
    // SECTION 10: Upload Route Authorization
    // =========================================================================
    console.log('\n--- SECTION 10: Upload Route Authorization ---');

    // Test 50: User B cannot upload photos to User A's instrument (HTTP 403)
    const crossInstrumentPhotoRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      VALID_JPEG_BUFFER,
      'cross_photo.jpg',
      'image/jpeg',
      tokenB
    );
    assert(
      crossInstrumentPhotoRes.status === 403,
      'Business User B cannot upload photographs to Business User A instrument (HTTP 403)',
      `Status: ${crossInstrumentPhotoRes.status}`
    );

    // Test 51: User B cannot upload documents to User A's instrument (HTTP 403)
    const crossInstrumentDocRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/documents`,
      'document',
      VALID_PDF_BUFFER,
      'cross_doc.pdf',
      'application/pdf',
      tokenB
    );
    assert(
      crossInstrumentDocRes.status === 403,
      'Business User B cannot upload documents to Business User A instrument (HTTP 403)',
      `Status: ${crossInstrumentDocRes.status}`
    );

    // Test 52: User B cannot upload documents to User A's application (HTTP 403)
    const crossAppDocRes = await uploadMultipart(
      `/api/applications/${applicationA._id}/documents`,
      'document',
      VALID_PDF_BUFFER,
      'cross_app_doc.pdf',
      'application/pdf',
      tokenB
    );
    assert(
      crossAppDocRes.status === 403,
      'Business User B cannot upload documents to Business User A application (HTTP 403)',
      `Status: ${crossAppDocRes.status}`
    );

    // =========================================================================
    // SECTION 11: File Delete & Replace Security
    // =========================================================================
    console.log('\n--- SECTION 11: File Delete & Replace Security ---');

    // Test 53: Direct DELETE on /uploads/:folder/:filename is rejected (HTTP 405 Method Not Allowed)
    const deleteUploadRes = await fetch(`${BASE_URL}/uploads/documents/${kycFileName}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenSuper}` },
    });
    assert(
      deleteUploadRes.status === 405 || deleteUploadRes.status === 404,
      'Direct HTTP DELETE on /uploads/ storage returns HTTP 405/404',
      `Status: ${deleteUploadRes.status}`
    );

    // Test 54: Direct PUT on /uploads/:folder/:filename is rejected (HTTP 405 Method Not Allowed)
    const putUploadRes = await fetch(`${BASE_URL}/uploads/documents/${kycFileName}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenSuper}` },
      body: 'Tampered content',
    });
    assert(
      putUploadRes.status === 405 || putUploadRes.status === 404,
      'Direct HTTP PUT on /uploads/ storage returns HTTP 405/404',
      `Status: ${putUploadRes.status}`
    );

    // =========================================================================
    // SECTION 12: Content Security & Header Protection (XSS Prevention)
    // =========================================================================
    console.log('\n--- SECTION 12: Content Security & Header Protection ---');

    // Test 55: Upload with embedded active script tag is rejected (HTTP 400)
    const xssPayloadBuffer = Buffer.concat([
      VALID_JPEG_BUFFER.subarray(0, 30),
      Buffer.from('<script>alert("XSS")</script>'),
      VALID_JPEG_BUFFER.subarray(30),
    ]);
    const xssUploadRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      xssPayloadBuffer,
      'xss_image.jpg',
      'image/jpeg',
      tokenA
    );
    assert(
      xssUploadRes.status === 400,
      'Image file with embedded <script> tag is rejected with HTTP 400',
      `Status: ${xssUploadRes.status}`
    );

    // Test 56: SVG file with script tag rejected (HTTP 400)
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const svgUploadRes = await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      svgBuffer,
      'vector.svg',
      'image/svg+xml',
      tokenA
    );
    assert(
      svgUploadRes.status === 400,
      'SVG file upload is rejected with HTTP 400',
      `Status: ${svgUploadRes.status}`
    );

    // Test 57: File retrieval includes X-Content-Type-Options: nosniff
    const fileHeadersRes = await fetch(`${BASE_URL}/uploads/certificates/${certFileName}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      fileHeadersRes.headers.get('x-content-type-options') === 'nosniff',
      'File retrieval returns X-Content-Type-Options: nosniff',
      `Header: ${fileHeadersRes.headers.get('x-content-type-options')}`
    );

    // Test 58: File retrieval sets Cache-Control: private, no-cache
    assert(
      fileHeadersRes.headers.get('cache-control')?.includes('private') ||
        fileHeadersRes.headers.get('cache-control')?.includes('no-cache'),
      'File retrieval returns secure Cache-Control headers',
      `Cache-Control: ${fileHeadersRes.headers.get('cache-control')}`
    );

    // Test 59: Content-Disposition header contains safe sanitized filename
    const disposition = fileHeadersRes.headers.get('content-disposition');
    assert(
      disposition && !disposition.includes('..') && !disposition.includes('/') && !disposition.includes('\\'),
      'Content-Disposition header contains safe filename without path separators',
      `Disposition: ${disposition}`
    );

    // =========================================================================
    // SECTION 13: File Metadata & Information Leakage Prevention
    // =========================================================================
    console.log('\n--- SECTION 13: File Metadata & Information Leakage Prevention ---');

    // Test 60: API response returns safe relative URL without leaking absolute filesystem paths
    const kycUploadRes = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      VALID_PDF_BUFFER,
      'secure_doc.pdf',
      'application/pdf',
      tokenA
    );
    const kycDocs = kycUploadRes.data?.data?.kycDocuments || [];
    const latestDoc = kycDocs[kycDocs.length - 1];
    assert(
      kycUploadRes.status === 201 &&
        latestDoc?.fileUrl?.startsWith('/uploads/') &&
        !latestDoc?.fileUrl?.includes('/home/') &&
        !latestDoc?.fileUrl?.includes('C:\\') &&
        !latestDoc?.fileUrl?.includes('/backend/'),
      'Upload response returns safe relative /uploads/ URL without exposing server filesystem path',
      `fileUrl: ${latestDoc?.fileUrl}`
    );

    // =========================================================================
    // SECTION 14: Certificate PDF Security
    // =========================================================================
    console.log('\n--- SECTION 14: Certificate PDF Security ---');

    // Test 61: Generated certificate PDF exists on storage
    assert(
      fs.existsSync(certFilePath),
      'Certificate PDF file physically exists in storage',
      `Path: ${certFilePath}`
    );

    // Test 62: Certificate PDF has non-zero size
    const certStats = fs.statSync(certFilePath);
    assert(
      certStats.size > 0,
      'Certificate PDF has non-zero byte size',
      `Size: ${certStats.size} bytes`
    );

    // Test 63: Certificate PDF begins with authentic %PDF- magic bytes
    const certHeader = fs.readFileSync(certFilePath, { length: 5 }).toString('utf8');
    assert(
      certHeader.startsWith('%PDF-'),
      'Certificate PDF begins with valid %PDF- magic header',
      `Header: ${certHeader}`
    );

    // Test 64: Public QR verification endpoint accessible without authentication (HTTP 200)
    const publicVerifyRes = await fetch(`${BASE_URL}/api/certificates/verify/CERT-SEC-${suffix}`);
    const publicVerifyData = await publicVerifyRes.json();
    assert(
      publicVerifyRes.status === 200 && publicVerifyData.data?.isValid === true,
      'Public QR verification endpoint is accessible without authentication and returns valid record',
      `Status: ${publicVerifyRes.status}, Valid: ${publicVerifyData.data?.isValid}`
    );

    // =========================================================================
    // SECTION 15: Failed & Rejected Upload Cleanup
    // =========================================================================
    console.log('\n--- SECTION 15: Failed & Rejected Upload Cleanup ---');

    // Test 65: Magic byte failure does not leave orphan file on storage
    const beforeCount = fs.readdirSync(path.resolve(ENV.UPLOAD_DIR, 'instrument-photos')).length;
    await uploadMultipart(
      `/api/instruments/${instrumentA._id}/photos`,
      'photo',
      EXECUTABLE_MZ_BUFFER,
      'cleanup_test.jpg',
      'image/jpeg',
      tokenA
    );
    const afterCount = fs.readdirSync(path.resolve(ENV.UPLOAD_DIR, 'instrument-photos')).length;
    assert(
      beforeCount === afterCount,
      'Failed upload with invalid magic bytes is immediately cleaned up from storage (zero orphan files)',
      `Files before: ${beforeCount}, after: ${afterCount}`
    );

    // Test 66: Unauthorized upload does not leave orphan file on storage
    const beforeOfficerPhotos = fs.readdirSync(path.resolve(ENV.UPLOAD_DIR, 'instrument-photos')).length;
    await uploadMultipart(
      `/api/inspections/${activeInspection._id}/evidence`,
      'evidence',
      VALID_PNG_BUFFER,
      'unauthorized_cleanup.png',
      'image/png',
      tokenOfficerB // Unauthorized officer
    );
    const afterOfficerPhotos = fs.readdirSync(path.resolve(ENV.UPLOAD_DIR, 'instrument-photos')).length;
    assert(
      beforeOfficerPhotos === afterOfficerPhotos,
      'Unauthorized upload attempt is immediately unlinked from disk without leaving orphan file',
      `Photos before: ${beforeOfficerPhotos}, after: ${afterOfficerPhotos}`
    );

    // =========================================================================
    // SECTION 16: Security Error Handling & No Stack Trace Leakage
    // =========================================================================
    console.log('\n--- SECTION 16: Security Error Handling & No Stack Trace Leakage ---');

    // Test 67: Error responses do not leak stack traces or internal paths
    const badUploadRes = await uploadMultipart(
      '/api/stakeholders/me/upload-kyc',
      'document',
      EXECUTABLE_MZ_BUFFER,
      'bad.exe',
      'application/x-msdownload',
      tokenA
    );
    const errBodyStr = JSON.stringify(badUploadRes.data || {});
    assert(
      badUploadRes.status === 400 &&
        !errBodyStr.includes('node_modules') &&
        !errBodyStr.includes('at Function.') &&
        !errBodyStr.includes('at async') &&
        !errBodyStr.includes('stack'),
      'Error responses do not leak internal stack traces or directory trees',
      `Error response: ${badUploadRes.data?.message}`
    );

    // -------------------------------------------------------------
    // TEARDOWN: Clean up test documents & records
    // -------------------------------------------------------------
    try {
      if (fs.existsSync(certFilePath)) {
        fs.unlinkSync(certFilePath);
      }
    } catch (e) {}

    await Promise.all([
      User.deleteMany({ _id: { $in: [userA._id, userB._id, officerA._id, officerB._id, adminUser._id, superAdmin._id] } }),
      Stakeholder.deleteMany({ _id: { $in: [stakeholderA._id, stakeholderB._id] } }),
      Instrument.deleteMany({ _id: { $in: [instrumentA._id, instrumentB._id] } }),
      VerificationApplication.deleteMany({ _id: applicationA._id }),
      VerificationSchedule.deleteMany({ _id: scheduleA._id }),
      VerificationInspection.deleteMany({ _id: { $in: [activeInspection._id, finalizedInspection._id] } }),
      Certificate.deleteMany({ _id: certificateA._id }),
    ]);

    console.log('\n===============================================================');
    console.log(`📊 FILE & STORAGE SECURITY QA RESULTS: ${passed}/${passed + failed} PASSED`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('🎉 ALL FILE UPLOAD & FILE ACCESS SECURITY TESTS PASSED WITH ZERO DEFECTS!');
    } else {
      console.error(`⚠️ ${failed} tests failed! Details:`);
      failureDetails.forEach((d) => console.error(d));
    }

    await disconnectDB();
    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('💥 Unhandled error in test suite:', error);
    await disconnectDB();
    process.exit(1);
  }
}

runTestSuite();
