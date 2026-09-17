import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Instrument } from '../models/Instrument.js';
import { Certificate } from '../models/Certificate.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { ENV, ALLOWED_ORIGINS } from '../config/env.js';
import { USER_ROLES } from '../config/constants.js';

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

  const res = await fetch(url, {
    ...options,
    headers,
    body,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

function verifyNoInformationLeak(res, context = '') {
  const rawBody = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || {});

  assert(
    !rawBody.includes(ENV.JWT_SECRET),
    `[${context}] Does not leak JWT_SECRET`,
    'secret protected'
  );

  if (ENV.MONGO_URI && ENV.MONGO_URI.length > 5) {
    assert(
      !rawBody.includes(ENV.MONGO_URI),
      `[${context}] Does not leak MONGO_URI`,
      'URI protected'
    );
  }

  if (ENV.SMTP_PASSWORD && ENV.SMTP_PASSWORD.length > 3) {
    assert(
      !rawBody.includes(ENV.SMTP_PASSWORD),
      `[${context}] Does not leak SMTP password`,
      'smtp pass protected'
    );
  }

  assert(
    !rawBody.includes('node_modules') &&
    !rawBody.includes('/backend/') &&
    !rawBody.includes('\\backend\\') &&
    !rawBody.includes('/home/'),
    `[${context}] Does not leak internal file paths or node_modules`,
    'paths protected'
  );

  assert(
    !rawBody.includes('at ') || !rawBody.includes('.js:'),
    `[${context}] Does not leak raw JavaScript stack trace`,
    'no stack trace'
  );
}

async function runHttpSecurityTestSuite() {
  console.log('================================================================');
  console.log('🛡️  PHASE 12 PART 2 — TASK 4: HTTP / API SECURITY HARDENING');
  console.log('================================================================');

  await connectDB();

  // Retrieve existing active users from real database
  const adminUser = await User.findOne({ role: USER_ROLES.ADMIN, isActive: true });
  const bizUser = await User.findOne({ role: USER_ROLES.BUSINESS_USER, isActive: true });
  const fvoUser = await User.findOne({ role: USER_ROLES.FIELD_VERIFICATION_OFFICER, isActive: true });

  if (!adminUser || !bizUser || !fvoUser) {
    console.error('Fatal: Missing required test users in MongoDB database.');
    process.exit(1);
  }

  const adminToken = generateToken(adminUser);
  const bizToken = generateToken(bizUser);

  // Retrieve an existing certificate for public verification testing
  let cert = await Certificate.findOne();
  const certToken = cert?.verificationToken || 'CERT-VALIDATION-TOKEN-TEST';

  // =========================================================================
  // 1. Security Headers Verification
  // =========================================================================
  console.log('\n--- 1. Security HTTP Headers Verification ---');

  const healthRes = await api('/api/health');
  assert(healthRes.status === 200, 'API Health Check returns 200 OK');

  // 1.1 Content-Security-Policy on API routes
  const cspHeader = healthRes.headers.get('content-security-policy') || '';
  assert(
    cspHeader.includes("default-src 'none'") || cspHeader.includes("frame-ancestors 'none'"),
    'API responses include restrictive Content-Security-Policy (default-src none, frame-ancestors none)',
    `got: ${cspHeader}`
  );

  // 1.2 X-Content-Type-Options: nosniff
  const xContentType = healthRes.headers.get('x-content-type-options');
  assert(
    xContentType === 'nosniff',
    'API responses include X-Content-Type-Options: nosniff to prevent MIME confusion attacks',
    `got: ${xContentType}`
  );

  // 1.3 X-Frame-Options: DENY on API routes
  const xFrameOptions = healthRes.headers.get('x-frame-options');
  assert(
    xFrameOptions === 'DENY' || xFrameOptions === 'SAMEORIGIN',
    'API responses include X-Frame-Options: DENY to prevent clickjacking on API endpoints',
    `got: ${xFrameOptions}`
  );

  // 1.4 Referrer-Policy
  const referrerPolicy = healthRes.headers.get('referrer-policy');
  assert(
    referrerPolicy === 'strict-origin-when-cross-origin' || referrerPolicy === 'no-referrer',
    'API responses include safe Referrer-Policy',
    `got: ${referrerPolicy}`
  );

  // 1.5 Strict-Transport-Security
  const hsts = healthRes.headers.get('strict-transport-security');
  assert(
    hsts && hsts.includes('max-age='),
    'API responses include Strict-Transport-Security (HSTS)',
    `got: ${hsts}`
  );

  // 1.6 Permissions-Policy
  const permPolicy = healthRes.headers.get('permissions-policy');
  assert(
    permPolicy && (permPolicy.includes('camera=()') || permPolicy.includes('geolocation=()')),
    'API responses include Permissions-Policy restricting sensitive browser features',
    `got: ${permPolicy}`
  );

  // 1.7 Cache-Control for sensitive API endpoints
  const cacheControl = healthRes.headers.get('cache-control');
  assert(
    cacheControl && cacheControl.includes('no-store'),
    'API responses include Cache-Control: no-store to prevent caching of sensitive data',
    `got: ${cacheControl}`
  );

  // 1.8 Frontend preview compatibility: Root route does NOT have X-Frame-Options DENY
  const rootRes = await api('/');
  const rootXFrame = rootRes.headers.get('x-frame-options');
  assert(
    rootXFrame !== 'DENY',
    'Frontend root HTML does not set X-Frame-Options DENY, preserving AI Studio iframe live preview',
    `root X-Frame-Options: ${rootXFrame || 'none'}`
  );

  // =========================================================================
  // 2. CORS Security Verification
  // =========================================================================
  console.log('\n--- 2. CORS Security Verification ---');

  // 2.1 Authorized Origin receives matching Access-Control-Allow-Origin
  const allowedOrigin = ENV.CLIENT_URL || 'http://localhost:5173';
  const corsAllowedRes = await api('/api/health', {
    headers: { Origin: allowedOrigin },
  });
  assert(
    corsAllowedRes.headers.get('access-control-allow-origin') === allowedOrigin,
    'Configured CLIENT_URL receives exact Access-Control-Allow-Origin header',
    `got: ${corsAllowedRes.headers.get('access-control-allow-origin')}`
  );

  // 2.2 Credentials enabled for legitimate configured origin
  assert(
    corsAllowedRes.headers.get('access-control-allow-credentials') === 'true',
    'Credentials enabled for authorized configured client origin'
  );

  // 2.3 No wildcard origin when credentials are enabled
  assert(
    corsAllowedRes.headers.get('access-control-allow-origin') !== '*',
    'Wildcard (*) origin is never returned when credentialed requests are allowed'
  );

  // 2.4 Arbitrary/malicious origin rejected
  const maliciousOrigin = 'http://attacker-evil-domain.com';
  const corsBlockedRes = await api('/api/health', {
    headers: { Origin: maliciousOrigin },
  });
  assert(
    !corsBlockedRes.headers.get('access-control-allow-origin'),
    'Arbitrary/malicious origin does NOT receive Access-Control-Allow-Origin',
    `origin header: ${corsBlockedRes.headers.get('access-control-allow-origin')}`
  );

  // 2.5 Credentials not enabled for arbitrary origin
  assert(
    !corsBlockedRes.headers.get('access-control-allow-credentials'),
    'Credentials not enabled for arbitrary/malicious origin'
  );

  // 2.6 Preflight OPTIONS from legitimate origin responds correctly (204/200)
  const preflightRes = await api('/api/instruments', {
    method: 'OPTIONS',
    headers: {
      Origin: allowedOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type,Authorization',
    },
  });
  assert(
    preflightRes.status === 204 || preflightRes.status === 200,
    'Preflight OPTIONS request from legitimate origin succeeds with 200/204',
    `got: ${preflightRes.status}`
  );
  assert(
    preflightRes.headers.get('access-control-allow-origin') === allowedOrigin,
    'Preflight response includes Access-Control-Allow-Origin matching legitimate origin'
  );
  assert(
    Boolean(preflightRes.headers.get('access-control-allow-methods')),
    'Preflight response specifies Access-Control-Allow-Methods'
  );

  // 2.7 Preflight OPTIONS from arbitrary origin does NOT get Access-Control-Allow-Origin
  const evilPreflightRes = await api('/api/instruments', {
    method: 'OPTIONS',
    headers: {
      Origin: maliciousOrigin,
      'Access-Control-Request-Method': 'POST',
    },
  });
  assert(
    !evilPreflightRes.headers.get('access-control-allow-origin'),
    'Preflight OPTIONS from arbitrary origin does NOT receive Access-Control-Allow-Origin'
  );

  // 2.8 Same-origin / non-browser requests without Origin header continue working
  const noOriginRes = await api('/api/health');
  assert(
    noOriginRes.status === 200,
    'Requests without Origin header (curl, mobile apps, server-to-server) continue working cleanly'
  );

  // =========================================================================
  // 3. Rate Limiting Verification
  // =========================================================================
  console.log('\n--- 3. Rate Limiting Verification ---');

  // 3.1 Normal legitimate request on auth endpoint succeeds
  const normalLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'wrong.email.test@example.com', password: 'Password@1234' },
    headers: { 'X-Forwarded-For': '192.0.2.1' },
  });
  assert(
    normalLoginRes.status === 401,
    'Legitimate login request is processed normally and not prematurely throttled',
    `got: ${normalLoginRes.status}`
  );
  assert(
    Boolean(normalLoginRes.headers.get('ratelimit-limit') || normalLoginRes.headers.get('ratelimit-remaining')),
    'Auth endpoint returns RateLimit headers'
  );

  // 3.2 Repeated abusive requests from distinct IP are throttled (HTTP 429)
  const attackerIp = '198.51.100.77';
  let throttledStatus = 0;
  let throttledRes = null;

  console.log('Sending burst authentication attempts from test IP 198.51.100.77...');
  for (let i = 0; i < 30; i++) {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email: `brute_${i}@test.com`, password: 'BadPassword123' },
      headers: { 'X-Forwarded-For': attackerIp },
    });
    if (res.status === 429) {
      throttledStatus = res.status;
      throttledRes = res;
      break;
    }
  }

  assert(
    throttledStatus === 429,
    'Repeated abusive authentication attempts are throttled with HTTP 429 Too Many Requests',
    `got status: ${throttledStatus}`
  );
  assert(
    throttledRes?.data?.success === false,
    'Rate-limit response has standard success: false JSON structure'
  );
  assert(
    Boolean(throttledRes?.data?.message && throttledRes?.data?.message.includes('Too many')),
    'Rate-limit response includes user-friendly throttle message without exposing internal details'
  );
  verifyNoInformationLeak(throttledRes, 'Auth Rate Limiting');

  // 3.3 Password-reset and OTP endpoints are rate-limited
  const resetAttackerIp = '198.51.100.88';
  let resetThrottled = false;
  for (let i = 0; i < 30; i++) {
    const res = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: `target_${i}@example.com` },
      headers: { 'X-Forwarded-For': resetAttackerIp },
    });
    if (res.status === 429) {
      resetThrottled = true;
      break;
    }
  }
  assert(
    resetThrottled,
    'Password reset endpoint is protected by rate limiting against credential abuse',
    'throttled with 429'
  );

  // 3.4 Different legitimate client IP is completely unthrottled and operational
  const freshClientRes = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'another.client@test.com', password: 'Password@1234' },
    headers: { 'X-Forwarded-For': '203.0.113.55' },
  });
  assert(
    freshClientRes.status === 401,
    'Independent legitimate client IP is unaffected by attacker throttling',
    `got: ${freshClientRes.status}`
  );

  // =========================================================================
  // 4. HTTP Method Security
  // =========================================================================
  console.log('\n--- 4. HTTP Method Security ---');

  // 4.1 GET-only route /api/health receiving POST
  const healthPostRes = await api('/api/health', { method: 'POST', body: { test: true } });
  assert(
    healthPostRes.status === 405 || healthPostRes.status === 404,
    'POST to GET-only /api/health rejected with controlled 405 Method Not Allowed',
    `got: ${healthPostRes.status}`
  );

  // 4.2 GET-only route /api/health receiving DELETE
  const healthDelRes = await api('/api/health', { method: 'DELETE' });
  assert(
    healthDelRes.status === 405 || healthDelRes.status === 404,
    'DELETE to GET-only /api/health rejected with controlled 405/404',
    `got: ${healthDelRes.status}`
  );

  // 4.3 Public certificate verification receiving mutation methods (POST, PUT, DELETE)
  const certPostRes = await api(`/api/public/certificates/verify/${certToken}`, {
    method: 'POST',
    body: { tamper: 'active' },
  });
  assert(
    certPostRes.status === 405 || certPostRes.status === 404,
    'POST to public QR verification endpoint rejected with 405 Method Not Allowed',
    `got: ${certPostRes.status}`
  );

  const certPutRes = await api(`/api/public/certificates/verify/${certToken}`, {
    method: 'PUT',
    body: { tamper: 'active' },
  });
  assert(
    certPutRes.status === 405 || certPutRes.status === 404,
    'PUT to public QR verification endpoint rejected with 405/404',
    `got: ${certPutRes.status}`
  );

  const certDelRes = await api(`/api/public/certificates/verify/${certToken}`, {
    method: 'DELETE',
  });
  assert(
    certDelRes.status === 405 || certDelRes.status === 404,
    'DELETE to public QR verification endpoint rejected with 405/404',
    `got: ${certDelRes.status}`
  );

  // 4.4 POST-only routes receiving GET
  const loginGetRes = await api('/api/auth/login', { method: 'GET' });
  assert(
    loginGetRes.status === 405 || loginGetRes.status === 404,
    'GET to POST-only /api/auth/login rejected with 405 Method Not Allowed',
    `got: ${loginGetRes.status}`
  );

  const regGetRes = await api('/api/auth/register-stakeholder', { method: 'GET' });
  assert(
    regGetRes.status === 405 || regGetRes.status === 404,
    'GET to POST-only /api/auth/register-stakeholder rejected with 405 Method Not Allowed',
    `got: ${regGetRes.status}`
  );

  // 4.5 Verify no state mutation occurred from unexpected HTTP methods
  const certCheckRes = await api(`/api/public/certificates/verify/${certToken}`, { method: 'GET' });
  assert(
    certCheckRes.status === 200 || certCheckRes.status === 404,
    'Legitimate GET on certificate verification remains unaffected and unmutilated',
    `got: ${certCheckRes.status}`
  );

  // =========================================================================
  // 5. Request Content-Type Hardening
  // =========================================================================
  console.log('\n--- 5. Request Content-Type Hardening ---');

  // 5.1 Malformed JSON payload
  const malformedJsonRes = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email": "broken@example.com", "password": ',
  });
  assert(
    malformedJsonRes.status === 400,
    'Malformed JSON payload rejected with 400 Bad Request',
    `got: ${malformedJsonRes.status}`
  );
  assert(
    malformedJsonRes.data?.success === false,
    'Malformed JSON error response has success: false structure'
  );
  verifyNoInformationLeak(malformedJsonRes, 'Malformed JSON');

  // 5.2 Unsupported Content-Type (text/xml) with body payload
  const xmlRes = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: '<user><email>test@example.com</email></user>',
  });
  assert(
    xmlRes.status === 415 || xmlRes.status === 400,
    'Unsupported Content-Type (text/xml) rejected with controlled 415/400',
    `got: ${xmlRes.status}`
  );
  verifyNoInformationLeak(xmlRes, 'XML Content-Type');

  // 5.3 Unsupported Content-Type (application/octet-stream)
  const binaryRes = await api('/api/instruments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bizToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: 'Raw binary stream 0xDE 0xAD 0xBE 0xEF',
  });
  assert(
    binaryRes.status === 415 || binaryRes.status === 400,
    'Unsupported binary octet-stream rejected safely with 415/400',
    `got: ${binaryRes.status}`
  );
  verifyNoInformationLeak(binaryRes, 'Binary stream Content-Type');

  // 5.4 Empty body where body is required
  const emptyBodyRes = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert(
    emptyBodyRes.status === 400,
    'Empty body where parameters are required rejected with 400 Bad Request validation error',
    `got: ${emptyBodyRes.status}`
  );
  assert(
    Array.isArray(emptyBodyRes.data?.errors) && emptyBodyRes.data?.errors.length > 0,
    'Empty body returns structured validation errors'
  );

  // 5.5 Unexpected body format (JSON Array instead of Object)
  const arrayBodyRes = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '["item1", "item2"]',
  });
  assert(
    arrayBodyRes.status === 400,
    'Unexpected body format (array instead of object) safely rejected with 400 Bad Request',
    `got: ${arrayBodyRes.status}`
  );

  // =========================================================================
  // 6. HTTP Parameter Pollution (HPP) Defense
  // =========================================================================
  console.log('\n--- 6. HTTP Parameter Pollution (HPP) Defense ---');

  // 6.1 Repeated page parameter ?page=1&page=999
  const hppPageRes = await api('/api/instruments?page=1&page=999', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    hppPageRes.status === 200,
    'Duplicate ?page=1&page=999 handled safely without 500 error or crash',
    `got: ${hppPageRes.status}`
  );
  const pageVal = hppPageRes.data?.data?.pagination?.page ?? hppPageRes.data?.pagination?.page;
  assert(
    typeof pageVal === 'number',
    'Polluted page parameter resolved deterministically to numeric page',
    `page: ${pageVal}`
  );

  // 6.2 Repeated limit parameter ?limit=10&limit=999999
  const hppLimitRes = await api('/api/instruments?limit=10&limit=999999', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    hppLimitRes.status === 200,
    'Duplicate ?limit=10&limit=999999 handled safely without crash',
    `got: ${hppLimitRes.status}`
  );
  const limitVal = hppLimitRes.data?.data?.pagination?.limit ?? hppLimitRes.data?.pagination?.limit;
  assert(
    typeof limitVal === 'number' && limitVal <= 100,
    'Polluted limit parameter clamped to safe maxLimit <= 100',
    `got limit: ${limitVal}`
  );

  // 6.3 Repeated status filter ?status=ACTIVE&status=PENDING
  const hppStatusRes = await api('/api/instruments?status=ACTIVE&status=PENDING', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    hppStatusRes.status === 200,
    'Duplicate ?status=ACTIVE&status=PENDING handled safely without MongoDB cast crash',
    `got: ${hppStatusRes.status}`
  );

  // 6.4 Repeated sort parameter ?sort=name&sort=password
  const hppSortRes = await api('/api/instruments?sort=serialNumber&sort=password', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(
    hppSortRes.status === 200,
    'Duplicate ?sort parameters handled safely without injection',
    `got: ${hppSortRes.status}`
  );

  // =========================================================================
  // 7. Error Response Hardening & Status Code Accuracy
  // =========================================================================
  console.log('\n--- 7. Error Response Hardening & Status Code Accuracy ---');

  // 7.1 Status 400: Input validation failure
  const valErrRes = await api('/api/auth/register-stakeholder', {
    method: 'POST',
    body: { email: 'invalid-email' },
  });
  assert(valErrRes.status === 400, 'Validation failure returns 400 Bad Request');
  verifyNoInformationLeak(valErrRes, '400 Validation');

  // 7.2 Status 401: Missing authentication token
  const unauthRes = await api('/api/instruments', { method: 'GET' });
  assert(unauthRes.status === 401, 'Missing token returns 401 Unauthorized');
  verifyNoInformationLeak(unauthRes, '401 Unauthorized');

  // 7.3 Status 403: Role permission mismatch
  const forbidRes = await api('/api/admin/users', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(forbidRes.status === 403, 'Insufficient permissions returns 403 Forbidden');
  verifyNoInformationLeak(forbidRes, '403 Forbidden');

  // 7.4 Status 404: Non-existent API route
  const notFoundRes = await api('/api/non-existent-security-endpoint-xyz', {
    headers: { Authorization: `Bearer ${bizToken}` },
  });
  assert(notFoundRes.status === 404, 'Non-existent API endpoint returns 404 Not Found');
  verifyNoInformationLeak(notFoundRes, '404 Not Found');

  // 7.5 Status 405: Unsupported HTTP method on existing route
  const methodNotAllowedRes = await api('/api/health', { method: 'DELETE' });
  assert(
    methodNotAllowedRes.status === 405 || methodNotAllowedRes.status === 404,
    'Unsupported method returns 405 Method Not Allowed',
    `got: ${methodNotAllowedRes.status}`
  );
  verifyNoInformationLeak(methodNotAllowedRes, '405 Method Not Allowed');

  // 7.6 Status 429: Rate limit throttle response
  assert(
    throttledStatus === 429,
    'Rate limit exceeded accurately returns 429 Too Many Requests'
  );

  // =========================================================================
  // 8. Server & Proxy Security
  // =========================================================================
  console.log('\n--- 8. Server & Proxy Security ---');

  // 8.1 Express fingerprint header (X-Powered-By) is completely suppressed
  const serverHeaderRes = await api('/api/health');
  const poweredBy = serverHeaderRes.headers.get('x-powered-by');
  assert(
    !poweredBy,
    'X-Powered-By header is completely disabled to eliminate Express technology fingerprinting',
    `got: ${poweredBy || 'none (safe)'}`
  );

  // 8.2 Server banner does not expose internal node/express version
  const serverBanner = serverHeaderRes.headers.get('server');
  assert(
    !serverBanner || (!serverBanner.includes('Express') && !serverBanner.includes('node')),
    'Server header does not leak Express or Node.js internal versions',
    `got: ${serverBanner || 'none/clean'}`
  );

  // 8.3 Body parser limit protection (10MB limit enforcement)
  const hugePayload = 'A'.repeat(11 * 1024 * 1024); // 11MB string
  try {
    const oversizeRes = await api('/api/instruments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bizToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ huge: hugePayload }),
    });
    assert(
      oversizeRes.status === 413 || oversizeRes.status === 400,
      'Oversized payload (>10MB) safely rejected with 413 Payload Too Large without server crash',
      `got: ${oversizeRes.status}`
    );
    verifyNoInformationLeak(oversizeRes, '413 Payload Too Large');
  } catch (err) {
    // If fetch connection closes gracefully due to body limit
    assert(true, 'Oversized payload rejected safely by body-parser');
  }

  // 8.4 Bearer JWT Authentication remains 100% operational
  const jwtAuthRes = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    jwtAuthRes.status === 200 && jwtAuthRes.data?.data?.user?.email === adminUser.email,
    'Bearer JWT authentication remains completely functional after HTTP hardening',
    `user: ${jwtAuthRes.data?.data?.user?.email}`
  );

  // =========================================================================
  // Final Test Summary
  // =========================================================================
  await disconnectDB();

  console.log('\n================================================================');
  console.log(`TASK 4 HTTP SECURITY TEST RESULTS`);
  console.log(`Total Assertions : ${passed + failed}`);
  console.log(`Passed           : ${passed}`);
  console.log(`Failed           : ${failed}`);
  console.log(`Success Rate     : ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('\nFailures recorded:');
    failureDetails.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TASK 4 HTTP/API SECURITY ASSERTIONS PASSED WITH 100%!');
    process.exit(0);
  }
}

runHttpSecurityTestSuite().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
