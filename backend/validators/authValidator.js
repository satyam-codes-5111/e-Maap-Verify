import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  selectedRole: z.string().optional(),
});

export const registerStakeholderSchema = z.object({
  name: z.string().min(2, 'Contact person name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().min(10, 'Valid 10-digit mobile number is required'),
  businessName: z.string().min(3, 'Business or organization name is required'),
  tradeLicenseNumber: z.string().min(3, 'Valid trade license number is required'),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  businessType: z.enum([
    'MANUFACTURER',
    'DEALER',
    'REPAIRER',
    'PETROL_PUMP',
    'RETAILER',
    'INDUSTRIAL_WEIGHBRIDGE',
    'JEWELER',
    'OTHER',
  ]).optional(),
  registeredAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(6, 'Valid 6-digit pincode is required'),
  }).optional(),
});

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];
      const errorMessages = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(ApiError.badRequest('Validation error', errorMessages));
    }
    next(error);
  }
};
