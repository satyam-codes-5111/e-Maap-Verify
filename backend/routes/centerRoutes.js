import { Router } from 'express';
import { VerificationCenter } from '../models/VerificationCenter.js';
import { ApiResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// GET /api/centers - list verification centers
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { district, state, type } = req.query;
    const filter = { isActive: true };

    if (district) {
      filter['jurisdiction.district'] = new RegExp(district, 'i');
    }
    if (state) {
      filter['jurisdiction.state'] = new RegExp(state, 'i');
    }
    if (type) {
      filter.type = type;
    }

    const centers = await VerificationCenter.find(filter).sort({ name: 1 });
    return ApiResponse.success(res, centers, 'Verification centers retrieved successfully');
  })
);

// GET /api/centers/:id - get single verification center
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const center = await VerificationCenter.findById(req.params.id);
    if (!center) {
      throw ApiError.notFound('Verification center not found');
    }
    return ApiResponse.success(res, center, 'Verification center retrieved successfully');
  })
);

export default router;
