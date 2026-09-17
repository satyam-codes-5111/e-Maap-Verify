import { z } from 'zod';

export const updateStakeholderSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').optional(),
  tradeLicenseNumber: z.string().min(2, 'Trade license number is required').optional(),
  gstNumber: z.string().max(20, 'GST number must not exceed 20 characters').optional().or(z.literal('')),
  panNumber: z.string().max(15, 'PAN number must not exceed 15 characters').optional().or(z.literal('')),
  businessType: z.enum([
    'MANUFACTURER',
    'DEALER',
    'REPAIRER',
    'PETROL_PUMP',
    'RETAILER',
    'INDUSTRIAL_WEIGHBRIDGE',
    'JEWELER',
    'OTHER',
  ], {
    errorMap: () => ({ message: 'Invalid business type' }),
  }).optional(),
  registeredAddress: z.object({
    street: z.string().min(1, 'Street is required').optional(),
    city: z.string().min(1, 'City is required').optional(),
    district: z.string().min(1, 'District is required').optional(),
    state: z.string().min(1, 'State is required').optional(),
    pincode: z.string().min(6, 'Pincode must be at least 6 characters').optional(),
  }).optional(),
  contactPerson: z.object({
    name: z.string().min(2, 'Contact person name must be at least 2 characters').optional(),
    designation: z.string().optional(),
    phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
    email: z.string().email('Valid email address is required').optional(),
  }).optional(),
}).passthrough();

export const updateKycStatusSchema = z.object({
  kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED'], {
    errorMap: () => ({ message: 'Invalid KYC status. Must be PENDING, VERIFIED, or REJECTED' }),
  }),
  kycRemarks: z.string().optional(),
});
