import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env.js';
import { Stakeholder } from '../models/Stakeholder.js';
import { Instrument } from '../models/Instrument.js';
import { VerificationApplication } from '../models/VerificationApplication.js';
import { VerificationInspection } from '../models/VerificationInspection.js';
import { Certificate } from '../models/Certificate.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { USER_ROLES } from '../config/constants.js';

const ALLOWED_FOLDERS = ['documents', 'certificates', 'instrument-photos'];

export const getSecureFile = asyncHandler(async (req, res) => {
  const { folder, filename } = req.params;

  // 1. Validate Category Folder
  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw ApiError.badRequest('Invalid file category directory');
  }

  // 2. Strict Path Traversal & Malicious Characters Detection
  if (!filename || typeof filename !== 'string') {
    throw ApiError.badRequest('Invalid or missing filename');
  }

  const rawFilename = String(filename);
  if (
    rawFilename.includes('..') ||
    rawFilename.includes('/') ||
    rawFilename.includes('\\') ||
    /%2e/i.test(rawFilename) ||
    /%2f/i.test(rawFilename) ||
    /%5c/i.test(rawFilename) ||
    /[\0\r\n\t]/.test(rawFilename) ||
    rawFilename.startsWith('.')
  ) {
    throw ApiError.badRequest('Security violation: Invalid filename or path traversal detected.');
  }

  const safeFilename = path.basename(rawFilename);
  const baseUploadDir = path.resolve(ENV.UPLOAD_DIR);
  const targetDir = path.resolve(baseUploadDir, folder);
  const targetFilePath = path.resolve(targetDir, safeFilename);

  // Ensure targetFilePath is strictly inside targetDir
  if (!targetFilePath.startsWith(targetDir)) {
    throw ApiError.badRequest('Security violation: Invalid file path detected.');
  }

  // 3. Granular Access Control & RBAC
  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    const stakeholder = await Stakeholder.findOne({ user: req.user._id });
    if (!stakeholder) {
      throw ApiError.forbidden('Access denied. No active stakeholder profile found.');
    }

    const [inStakeholder, inInstrument, inApplication, inInspection, inCertificate] = await Promise.all([
      Stakeholder.exists({
        _id: stakeholder._id,
        'kycDocuments.fileUrl': { $regex: safeFilename },
      }),
      Instrument.exists({
        stakeholder: stakeholder._id,
        $or: [
          { 'photographs.fileUrl': { $regex: safeFilename } },
          { 'documents.fileUrl': { $regex: safeFilename } },
        ],
      }),
      VerificationApplication.exists({
        stakeholder: stakeholder._id,
        'documents.fileUrl': { $regex: safeFilename },
      }),
      VerificationInspection.exists({
        stakeholder: stakeholder._id,
        $or: [
          { 'photos.fileUrl': { $regex: safeFilename } },
          { 'photographs.fileUrl': { $regex: safeFilename } },
        ],
      }),
      Certificate.exists({
        stakeholder: stakeholder._id,
        $or: [
          { certificatePdfPath: { $regex: safeFilename } },
          { certificateUrl: { $regex: safeFilename } },
          { qrCodeDataUrl: { $regex: safeFilename } },
        ],
      }),
    ]);

    if (!inStakeholder && !inInstrument && !inApplication && !inInspection && !inCertificate) {
      throw ApiError.forbidden('Access denied. You do not have permission to view or download this document.');
    }
  } else if (req.user.role === USER_ROLES.FIELD_VERIFICATION_OFFICER) {
    // Field Verification Officers can only view evidence / documents for inspections or applications assigned to them
    const [assignedInspection, assignedApplication] = await Promise.all([
      VerificationInspection.exists({
        $and: [
          { $or: [{ assignedOfficer: req.user._id }, { officer: req.user._id }] },
          {
            $or: [
              { 'photos.fileUrl': { $regex: safeFilename } },
              { 'photographs.fileUrl': { $regex: safeFilename } },
            ],
          },
        ],
      }),
      VerificationApplication.exists({
        assignedLMO: req.user._id,
        'documents.fileUrl': { $regex: safeFilename },
      }),
    ]);

    if (!assignedInspection && !assignedApplication) {
      throw ApiError.forbidden('Access denied. You are not authorized to view evidence or documents for an unassigned inspection.');
    }
  } else if (req.user.role === USER_ROLES.GATC_OFFICER) {
    const isAssigned = await VerificationInspection.exists({
      $and: [
        { $or: [{ assignedOfficer: req.user._id }, { officer: req.user._id }] },
        {
          $or: [
            { 'photos.fileUrl': { $regex: safeFilename } },
            { 'photographs.fileUrl': { $regex: safeFilename } },
          ],
        },
      ],
    });

    if (!isAssigned) {
      throw ApiError.forbidden('Access denied. You are not authorized to view this document.');
    }
  } else if (req.user.role === USER_ROLES.LEGAL_METROLOGY_OFFICER) {
    // If the file is an inspection photo, ensure the LMO is assigned to the inspection
    const inspectionDoc = await VerificationInspection.findOne({
      $or: [
        { 'photos.fileUrl': { $regex: safeFilename } },
        { 'photographs.fileUrl': { $regex: safeFilename } },
      ],
    });

    if (inspectionDoc) {
      const isAssigned =
        String(inspectionDoc.assignedOfficer) === String(req.user._id) ||
        String(inspectionDoc.officer) === String(req.user._id);
      if (!isAssigned) {
        throw ApiError.forbidden('Access denied. You are not authorized to view photos for an unassigned inspection.');
      }
    }
  } else if (
    req.user.role !== USER_ROLES.SUPER_ADMIN &&
    req.user.role !== USER_ROLES.ADMIN
  ) {
    throw ApiError.forbidden('Access denied. Unauthorized user role.');
  }

  // 4. File Existence Check
  if (!fs.existsSync(targetFilePath)) {
    throw ApiError.notFound('Requested file not found on server.');
  }

  // 5. Content Security & Download Headers
  const ext = path.extname(safeFilename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const safeDownloadName = safeFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Disposition', `inline; filename="${safeDownloadName}"`);

  return res.sendFile(targetFilePath);
});

