import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Certificate } from '../models/Certificate.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import { USER_ROLES, CERTIFICATE_STATUSES } from '../config/constants.js';
import * as certificateService from '../services/certificateService.js';
import { generateCertificatePDF } from '../services/pdfService.js';
import { generateVerificationQR } from '../services/qrService.js';

/**
 * Generate Certificate for a finalized PASSED/VERIFIED inspection
 * POST /api/certificates/generate/:inspectionId
 */
export const generateCertificate = asyncHandler(async (req, res) => {
  const inspectionId = req.params.inspectionId || req.body.inspectionId;

  if (!inspectionId) {
    throw ApiError.badRequest('Inspection ID is required for certificate generation.');
  }

  const certificate = await certificateService.generateCertificateForInspection({
    inspectionId,
    user: req.user,
    validityYears: req.body.validityYears,
    remarks: req.body.remarks,
  });

  return ApiResponse.created(
    res,
    certificate,
    `Digital Verification Certificate ${certificate.certificateNumber} generated successfully.`
  );
});

/**
 * List Certificates with pagination, filtering, search, and RBAC
 * GET /api/certificates
 */
export const getCertificates = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);
  const filter = {};

  const andConditions = [];

  // RBAC Filtering
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      return ApiResponse.success(res, buildPaginationResponse([], 0, page, limit));
    }
    filter.stakeholder = stakeholder._id;
  } else if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    if (req.user.jurisdiction?.district) {
      // Find stakeholders in this jurisdiction
      const stakeholders = await Stakeholder.find({
        'registeredAddress.district': req.user.jurisdiction.district,
      }).select('_id');
      const stakeholderIds = stakeholders.map((s) => s._id);
      andConditions.push({
        $or: [
          { issuedBy: req.user._id },
          { issuedByOfficer: req.user._id },
          { stakeholder: { $in: stakeholderIds } },
        ],
      });
    }
  }

  // Filter by status (support both 'status' and 'certificateStatus')
  if (req.query.status || req.query.certificateStatus) {
    const statusQuery = req.query.status || req.query.certificateStatus;
    const now = new Date();
    if (statusQuery === 'ACTIVE' || statusQuery === 'VALID') {
      andConditions.push({
        $or: [
          { certificateStatus: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
          { status: { $in: [CERTIFICATE_STATUSES.ACTIVE, CERTIFICATE_STATUSES.VALID] } },
        ],
      });
      filter.validUntil = { $gte: now };
    } else if (statusQuery === 'EXPIRED') {
      andConditions.push({
        $or: [
          { certificateStatus: CERTIFICATE_STATUSES.EXPIRED },
          { status: CERTIFICATE_STATUSES.EXPIRED },
          { validUntil: { $lt: now } },
        ],
      });
    } else {
      andConditions.push({
        $or: [
          { certificateStatus: statusQuery },
          { status: statusQuery },
        ],
      });
    }
  }

  // Filter by search query (certificateNumber, qrToken, sealNumber)
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    andConditions.push({
      $or: [
        { certificateNumber: searchRegex },
        { sealNumber: searchRegex },
        { qrToken: searchRegex },
        { qrVerificationToken: searchRegex },
      ],
    });
  }

  // Filter by date range for validUntil
  if (req.query.validUntilFrom || req.query.validUntilTo) {
    filter.validUntil = filter.validUntil || {};
    if (req.query.validUntilFrom) {
      filter.validUntil.$gte = new Date(req.query.validUntilFrom);
    }
    if (req.query.validUntilTo) {
      filter.validUntil.$lte = new Date(req.query.validUntilTo);
    }
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const [certificates, total] = await Promise.all([
    Certificate.find(filter)
      .populate('stakeholder', 'businessName tradeLicenseNumber registeredAddress')
      .populate('instrument', 'instrumentId category instrumentType serialNumber manufacturer capacity modelNumber')
      .populate('issuedBy', 'name email designation jurisdiction')
      .populate('issuedByOfficer', 'name email designation jurisdiction')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Certificate.countDocuments(filter),
  ]);

  // Map dynamic status onto list
  const formattedCertificates = certificates.map((cert) => {
    const dynStatus = certificateService.getDynamicStatus(cert);
    const obj = cert.toObject();
    obj.dynamicStatus = dynStatus;
    return obj;
  });

  return ApiResponse.success(
    res,
    buildPaginationResponse(formattedCertificates, total, page, limit),
    'Certificates retrieved successfully'
  );
});

/**
 * Get Certificate details by ID
 * GET /api/certificates/:id
 */
export const getCertificateById = asyncHandler(async (req, res) => {
  let certificate = null;
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    certificate = await Certificate.findById(req.params.id)
      .populate('stakeholder')
      .populate('instrument')
      .populate('application', 'applicationNumber applicationType currentStatus')
      .populate('inspection', 'inspectionNumber inspectionStatus result finalizedAt')
      .populate('issuedBy', 'name email designation jurisdiction')
      .populate('issuedByOfficer', 'name email designation jurisdiction')
      .populate('revokedBy', 'name email designation');
  } else {
    certificate = await Certificate.findOne({ certificateNumber: req.params.id })
      .populate('stakeholder')
      .populate('instrument')
      .populate('application', 'applicationNumber applicationType currentStatus')
      .populate('inspection', 'inspectionNumber inspectionStatus result finalizedAt')
      .populate('issuedBy', 'name email designation jurisdiction')
      .populate('issuedByOfficer', 'name email designation jurisdiction')
      .populate('revokedBy', 'name email designation');
  }

  if (!certificate) {
    throw ApiError.notFound('Certificate not found.');
  }

  // RBAC: Stakeholder can only view their own certificates
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(certificate.stakeholder._id) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to view this certificate.');
    }
  }

  const certObj = certificate.toObject();
  certObj.dynamicStatus = certificateService.getDynamicStatus(certificate);

  return ApiResponse.success(res, certObj, 'Certificate retrieved successfully');
});

/**
 * Download Certificate PDF
 * GET /api/certificates/:id/pdf
 * GET /api/certificates/:id/download
 */
export const downloadCertificatePdf = asyncHandler(async (req, res) => {
  let certificate = null;
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    certificate = await Certificate.findById(req.params.id);
  } else {
    certificate = await Certificate.findOne({ certificateNumber: req.params.id });
  }

  if (!certificate) {
    throw ApiError.notFound('Certificate not found.');
  }

  // RBAC check: Business User can only download own certificate; Government Officers and Admins can download
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(certificate.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to download this certificate.');
    }
  } else if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN &&
    req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER &&
    req.user.role !== USER_ROLES.FIELD_VERIFICATION_OFFICER &&
    req.user.role !== USER_ROLES.GATC_OFFICER
  ) {
    throw ApiError.forbidden('You are not authorized to download this certificate.');
  }

  const certsDir = path.resolve(process.cwd(), 'uploads', 'certificates');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const safeCertNum = String(certificate.certificateNumber || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_');

  // Candidate paths where PDF may reside
  const candidatePaths = [];
  const rawPath = certificate.pdfUrl || certificate.certificatePdfPath || certificate.certificateUrl;
  if (rawPath && typeof rawPath === 'string' && !rawPath.includes('..') && !/%2e/i.test(rawPath)) {
    const normalized = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    candidatePaths.push(path.resolve(process.cwd(), normalized));
    candidatePaths.push(path.resolve(certsDir, path.basename(normalized)));
  }
  candidatePaths.push(path.resolve(certsDir, `${safeCertNum}.pdf`));
  if (certificate.certificateNumber && !certificate.certificateNumber.includes('/')) {
    candidatePaths.push(path.resolve(certsDir, `${certificate.certificateNumber}.pdf`));
  }

  let filePath = candidatePaths.find((p) => fs.existsSync(p));

  // If PDF file does not exist on disk, generate using the authentic MongoDB certificate record
  if (!filePath || !fs.existsSync(filePath)) {
    try {
      const populatedCert = await Certificate.findById(certificate._id)
        .populate('stakeholder')
        .populate('instrument')
        .populate('application')
        .populate('issuedBy')
        .populate('issuedByOfficer');

      if (populatedCert && populatedCert.stakeholder && populatedCert.instrument) {
        let qrDataUrl = populatedCert.qrCodeDataUrl;
        let qrVerificationUrl = populatedCert.qrUrl;
        if (!qrDataUrl || !qrVerificationUrl) {
          const qrRes = await generateVerificationQR(populatedCert.qrToken || populatedCert.qrCodeToken || 'TOKEN-' + populatedCert._id);
          qrDataUrl = qrRes.qrDataUrl;
          qrVerificationUrl = qrRes.publicVerificationUrl;
        }

        const pdfResult = await generateCertificatePDF({
          certificateNumber: populatedCert.certificateNumber,
          applicationNumber: populatedCert.application?.applicationNumber || 'N/A',
          stakeholder: populatedCert.stakeholder,
          instrument: populatedCert.instrument,
          verificationDate: populatedCert.verificationDate || populatedCert.validFrom || populatedCert.issuedAt,
          validUntil: populatedCert.validUntil,
          verificationResult: populatedCert.result ? String(populatedCert.result) : 'VERIFIED (PASS)',
          officer: populatedCert.issuedBy || populatedCert.issuedByOfficer || req.user,
          qrDataUrl,
          qrToken: populatedCert.qrToken || populatedCert.qrCodeToken,
          verificationUrl: qrVerificationUrl,
          tamperEvidentHash: populatedCert.tamperEvidentHash || populatedCert.cryptographicHash || 'N/A',
        });

        if (pdfResult?.filePath && fs.existsSync(pdfResult.filePath)) {
          filePath = pdfResult.filePath;
          certificate.pdfUrl = pdfResult.relativeUrl;
          certificate.certificateUrl = pdfResult.relativeUrl;
          certificate.certificatePdfPath = pdfResult.relativeUrl;
          await certificate.save();
        }
      }
    } catch (genErr) {
      console.error('[CERTIFICATE PDF ON-DEMAND GENERATION ERROR]', genErr);
    }
  }

  if (!filePath || !fs.existsSync(filePath)) {
    throw ApiError.notFound('Certificate PDF file is not available on storage.');
  }

  // Security check: ensure filePath is inside allowed project directory
  const allowedBase = path.resolve(process.cwd());
  if (!filePath.startsWith(allowedBase)) {
    throw ApiError.forbidden('Security violation: Inaccessible certificate file path.');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeCertNum}.pdf"`
  );

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

/**
 * Revoke Certificate with statutory reason
 * PATCH /api/certificates/:id/revoke
 */
export const revokeCertificate = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid certificate ID format');
  }

  const { reason } = req.body;

  const certificate = await certificateService.revokeCertificate({
    certificateId: req.params.id,
    user: req.user,
    reason,
  });

  return ApiResponse.success(
    res,
    certificate,
    `Certificate ${certificate.certificateNumber} has been revoked successfully.`
  );
});

/**
 * Public Verification Endpoint - Real Database Lookup for QR codes
 * GET /api/public/certificates/verify/:token
 * GET /api/certificates/verify/:token
 * Accessible by anyone without authentication
 */
export const verifyCertificatePublic = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const verificationData = await certificateService.getPublicCertificateVerification(token);

  if (!verificationData) {
    return res.status(404).json({
      success: false,
      status: 'NOT_FOUND',
      message: 'Certificate record not found in official Legal Metrology database. Potential counterfeit or invalid QR code.',
    });
  }

  return ApiResponse.success(
    res,
    verificationData,
    'Certificate verification verified against live Legal Metrology database.'
  );
});
