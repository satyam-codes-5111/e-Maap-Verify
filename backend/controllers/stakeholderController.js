import mongoose from 'mongoose';
import { Stakeholder } from '../models/Stakeholder.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPaginationParams, buildPaginationResponse } from '../utils/pagination.js';
import { USER_ROLES, AUDIT_ACTIONS } from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';
import { escapeRegex } from '../utils/securityUtils.js';
import { cleanupFile, validateUploadedFile, sanitizeFileName } from '../utils/fileSecurity.js';

export const getStakeholders = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationParams(req.query);

  const filter = {};
  if (req.query.kycStatus) {
    filter.kycStatus = req.query.kycStatus;
  }
  if (req.query.district) {
    filter['registeredAddress.district'] = new RegExp(escapeRegex(req.query.district), 'i');
  }
  if (req.query.businessType) {
    filter.businessType = req.query.businessType;
  }
  if (req.query.search) {
    const safeSearch = escapeRegex(req.query.search);
    filter.$or = [
      { businessName: { $regex: safeSearch, $options: 'i' } },
      { tradeLicenseNumber: { $regex: safeSearch, $options: 'i' } },
      { gstNumber: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [stakeholders, total] = await Promise.all([
    Stakeholder.find(filter)
      .populate('user', 'name email phone role isActive')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Stakeholder.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    buildPaginationResponse(stakeholders, total, page, limit),
    'Stakeholders retrieved successfully'
  );
});

export const getMyStakeholderProfile = asyncHandler(async (req, res) => {
  const stakeholder = await Stakeholder.findOne({ user: req.user._id }).populate(
    'user',
    'name email phone role isActive'
  );
  if (!stakeholder) {
    throw ApiError.notFound('Stakeholder profile not found for authenticated user');
  }

  return ApiResponse.success(res, stakeholder, 'Stakeholder profile retrieved successfully');
});

export const getStakeholderById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid stakeholder ID format');
  }

  const stakeholder = await Stakeholder.findById(req.params.id).populate(
    'user',
    'name email phone role isActive'
  );
  if (!stakeholder) {
    throw ApiError.notFound('Stakeholder not found');
  }

  return ApiResponse.success(res, stakeholder, 'Stakeholder details retrieved successfully');
});

export const updateStakeholderProfile = asyncHandler(async (req, res) => {
  // Reject any unauthorized attempt to alter user accounts or roles
  if (req.body.role !== undefined || req.body.user !== undefined) {
    throw ApiError.badRequest('Modifying user role or user account association is strictly forbidden.');
  }

  let stakeholder = null;

  if (req.user.role === USER_ROLES.BUSINESS_USER) {
    if (req.body.kycStatus !== undefined || req.body.kycRemarks !== undefined) {
      throw ApiError.forbidden('Stakeholders are not permitted to alter their own KYC verification status.');
    }
    stakeholder = await Stakeholder.findOne({ user: req.user._id });
  } else {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw ApiError.badRequest('Invalid stakeholder ID format');
    }
    stakeholder = await Stakeholder.findById(req.params.id);
  }

  if (!stakeholder) {
    if (req.user.role !== USER_ROLES.BUSINESS_USER) {
      throw ApiError.notFound('Stakeholder profile not found');
    }

    // Required fields for creating an initial profile
    if (!req.body.businessName || req.body.businessName.trim().length < 2) {
      throw ApiError.badRequest('Legal business name is required and must be at least 2 characters.');
    }
    if (!req.body.tradeLicenseNumber || req.body.tradeLicenseNumber.trim().length < 2) {
      throw ApiError.badRequest('Trade license or registration number is required.');
    }

    const regAddr = req.body.registeredAddress || {};
    const street = regAddr.street || regAddr.addressLine || regAddr.line1 || '';
    if (!street.trim() || !regAddr.city || !regAddr.district || !regAddr.state || !regAddr.pincode) {
      throw ApiError.badRequest(
        'All registered address fields (street, city, district, state, pincode) are required.'
      );
    }

    // Check duplicate trade license
    const existing = await Stakeholder.findOne({
      tradeLicenseNumber: req.body.tradeLicenseNumber.trim(),
    });
    if (existing) {
      throw ApiError.conflict(
        `Trade license number '${req.body.tradeLicenseNumber}' is already registered with another business.`
      );
    }

    const contact = req.body.contactPerson || {};
    const contactName = contact.name || req.user.name;
    const contactPhone = contact.phone || req.user.phone;
    const contactEmail = contact.email || req.user.email;

    if (!contactName || contactName.trim().length < 2) {
      throw ApiError.badRequest('Contact person name is required.');
    }
    if (!contactPhone || contactPhone.trim().length < 10) {
      throw ApiError.badRequest('Valid 10-digit contact person phone number is required.');
    }
    if (!contactEmail || !contactEmail.includes('@')) {
      throw ApiError.badRequest('Valid contact person email is required.');
    }

    stakeholder = new Stakeholder({
      user: req.user._id,
      businessName: req.body.businessName.trim(),
      tradeLicenseNumber: req.body.tradeLicenseNumber.trim(),
      businessType: req.body.businessType || 'RETAILER',
      gstNumber: req.body.gstNumber ? req.body.gstNumber.trim().toUpperCase() : undefined,
      panNumber: req.body.panNumber ? req.body.panNumber.trim().toUpperCase() : undefined,
      registeredAddress: {
        street: street.trim(),
        city: regAddr.city.trim(),
        district: regAddr.district.trim(),
        state: regAddr.state.trim(),
        pincode: regAddr.pincode.trim(),
      },
      contactPerson: {
        name: contactName.trim(),
        designation: contact.designation ? contact.designation.trim() : undefined,
        phone: contactPhone.trim(),
        email: contactEmail.trim().toLowerCase(),
      },
      kycStatus: 'PENDING',
    });

    await stakeholder.save();

    await logAuditEvent({
      user: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email,
      action: AUDIT_ACTIONS.STAKEHOLDER_UPDATED || 'STAKEHOLDER_CREATED',
      entity: 'Stakeholder',
      entityId: stakeholder._id,
      metadata: {
        businessName: stakeholder.businessName,
        tradeLicenseNumber: stakeholder.tradeLicenseNumber,
      },
    });

    const populatedProfile = await Stakeholder.findById(stakeholder._id).populate(
      'user',
      'name email phone role isActive'
    );

    return ApiResponse.created(res, populatedProfile, 'Stakeholder business profile created successfully');
  }

  // Check duplicate trade license if being updated
  if (req.body.tradeLicenseNumber && req.body.tradeLicenseNumber !== stakeholder.tradeLicenseNumber) {
    const existing = await Stakeholder.findOne({
      tradeLicenseNumber: req.body.tradeLicenseNumber.trim(),
      _id: { $ne: stakeholder._id },
    });
    if (existing) {
      throw ApiError.conflict(
        `Trade license number '${req.body.tradeLicenseNumber}' is already registered with another business.`
      );
    }
    stakeholder.tradeLicenseNumber = req.body.tradeLicenseNumber.trim();
  }

  if (req.body.businessName) {
    stakeholder.businessName = req.body.businessName.trim();
  }
  if (req.body.businessType) {
    stakeholder.businessType = req.body.businessType;
  }
  if (req.body.gstNumber !== undefined) {
    stakeholder.gstNumber = req.body.gstNumber ? req.body.gstNumber.trim().toUpperCase() : undefined;
  }
  if (req.body.panNumber !== undefined) {
    stakeholder.panNumber = req.body.panNumber ? req.body.panNumber.trim().toUpperCase() : undefined;
  }

  if (req.body.registeredAddress) {
    stakeholder.registeredAddress = {
      ...(stakeholder.registeredAddress?.toObject?.() || stakeholder.registeredAddress || {}),
      ...req.body.registeredAddress,
    };
  }

  if (req.body.contactPerson) {
    stakeholder.contactPerson = {
      ...(stakeholder.contactPerson?.toObject?.() || stakeholder.contactPerson || {}),
      ...req.body.contactPerson,
    };
  }

  await stakeholder.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.STAKEHOLDER_UPDATED,
    entity: 'Stakeholder',
    entityId: stakeholder._id,
    metadata: {
      businessName: stakeholder.businessName,
      tradeLicenseNumber: stakeholder.tradeLicenseNumber,
    },
  });

  const updatedProfile = await Stakeholder.findById(stakeholder._id).populate(
    'user',
    'name email phone role isActive'
  );

  return ApiResponse.success(res, updatedProfile, 'Stakeholder profile updated successfully');
});

export const updateKycStatus = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('Invalid stakeholder ID format');
  }

  const { kycStatus, kycRemarks } = req.body;

  if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(kycStatus)) {
    throw ApiError.badRequest('Invalid KYC status. Must be PENDING, VERIFIED, or REJECTED');
  }

  const stakeholder = await Stakeholder.findById(req.params.id);
  if (!stakeholder) {
    throw ApiError.notFound('Stakeholder not found');
  }

  stakeholder.kycStatus = kycStatus;
  if (kycRemarks !== undefined) {
    stakeholder.kycRemarks = kycRemarks;
  }

  await stakeholder.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.STAKEHOLDER_UPDATED,
    entity: 'Stakeholder',
    entityId: stakeholder._id,
    metadata: { kycStatus, kycRemarks },
  });

  return ApiResponse.success(res, stakeholder, `Stakeholder KYC status updated to ${kycStatus}`);
});

export const uploadKycDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No document file was uploaded');
  }

  const stakeholder = await Stakeholder.findOne({ user: req.user._id });
  if (!stakeholder) {
    cleanupFile(req.file.path);
    throw ApiError.notFound('Stakeholder profile not found for authenticated user');
  }

  // Validate uploaded file magic bytes & security
  await validateUploadedFile(req.file);

  const safeOriginalName = sanitizeFileName(req.file.originalname);
  const docRecord = {
    docType: req.body.docType || 'TRADE_LICENSE',
    fileUrl: `/uploads/documents/${req.file.filename}`,
    fileName: safeOriginalName,
    verified: false,
    uploadedAt: new Date(),
  };

  stakeholder.kycDocuments.push(docRecord);
  await stakeholder.save();

  await logAuditEvent({
    user: req.user._id,
    userRole: req.user.role,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    entity: 'Stakeholder',
    entityId: stakeholder._id,
    metadata: {
      docType: docRecord.docType,
      fileName: docRecord.fileName,
      fileUrl: docRecord.fileUrl,
    },
  });

  return ApiResponse.created(res, stakeholder, 'KYC document uploaded successfully');
});

export const reverseGeocodeLocation = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat || req.query.latitude);
  const lon = parseFloat(req.query.lon || req.query.longitude);

  if (isNaN(lat) || isNaN(lon)) {
    throw ApiError.badRequest('Valid latitude and longitude coordinates are required.');
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LegalMetrologyPortal/1.0 (contact@gov.in)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return ApiResponse.success(
        res,
        {
          latitude: lat,
          longitude: lon,
          street: '',
          addressLine: '',
          city: '',
          district: '',
          state: '',
          pincode: '',
        },
        'Location captured successfully'
      );
    }

    const data = await response.json();
    const addr = data.address || {};

    const street = [addr.house_number, addr.road, addr.suburb || addr.neighbourhood]
      .filter(Boolean)
      .join(', ') || addr.road || addr.suburb || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';
    const district = addr.state_district
      ? addr.state_district.replace(/\s+District$/i, '')
      : (addr.county || addr.city_district || addr.district || '');
    const state = addr.state || '';
    const pincode = addr.postcode || '';

    return ApiResponse.success(
      res,
      {
        latitude: lat,
        longitude: lon,
        street,
        addressLine: street,
        city,
        district,
        state,
        pincode,
        displayName: data.display_name || '',
      },
      'Location reverse-geocoded successfully'
    );
  } catch (err) {
    // If reverse geocoding is unavailable or rate limited, return captured coordinates without fake data
    return ApiResponse.success(
      res,
      {
        latitude: lat,
        longitude: lon,
        street: '',
        addressLine: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
      },
      'Location coordinates captured. Please enter address details manually.'
    );
  }
});
