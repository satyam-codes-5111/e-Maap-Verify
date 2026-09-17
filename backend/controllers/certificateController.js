import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Certificate } from '../models/Certificate.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import { USER_ROLES, CERTIFICATE_STATUSES } from '../config/constants.js';
import * as certificateService from '../services/certificateService.js';

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
      filter.$or = [
        { issuedBy: req.user._id },
        { issuedByOfficer: req.user._id },
        { stakeholder: { $in: stakeholderIds } },
      ];
    }
  }

  // Filter by status (support both 'status' and 'certificateStatus')
  if (req.query.status || req.query.certificateStatus) {
    const statusQuery = req.query.status || req.query.certificateStatus;
    filter.$or = [
      { certificateStatus: statusQuery },
      { status: statusQuery },
    ];
  }

  // Filter by search query (certificateNumber, qrToken)
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { certificateNumber: searchRegex },
      { qrToken: searchRegex },
      { qrVerificationToken: searchRegex },
    ];
  }

  // Filter by date range for validUntil
  if (req.query.validUntilFrom || req.query.validUntilTo) {
    filter.validUntil = {};
    if (req.query.validUntilFrom) {
      filter.validUntil.$gte = new Date(req.query.validUntilFrom);
    }
    if (req.query.validUntilTo) {
      filter.validUntil.$lte = new Date(req.query.validUntilTo);
    }
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

  // RBAC check: Business User can only download own certificate; Admins and LMO can download
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder || String(certificate.stakeholder) !== String(stakeholder._id)) {
      throw ApiError.forbidden('You are not authorized to download this certificate.');
    }
  } else if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN &&
    req.user.role !== USER_ROLES.LEGAL_METROLOGY_OFFICER
  ) {
    throw ApiError.forbidden('You are not authorized to download this certificate.');
  }

  const relativePath = certificate.certificateUrl || certificate.certificatePdfPath;
  if (!relativePath || typeof relativePath !== 'string') {
    throw ApiError.notFound('Certificate PDF has not been generated for this record.');
  }

  // Prevent path traversal in stored path
  if (relativePath.includes('..') || /%2e/i.test(relativePath)) {
    throw ApiError.forbidden('Security violation: Invalid certificate file path.');
  }

  // Clean relative path leading slash if needed
  const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const filePath = path.resolve(process.cwd(), normalizedPath);
  const allowedBase = path.resolve(process.cwd());

  if (!filePath.startsWith(allowedBase)) {
    throw ApiError.forbidden('Security violation: Inaccessible certificate file path.');
  }

  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound('Certificate PDF file is not available on storage.');
  }

  const safeCertNum = String(certificate.certificateNumber || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
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
