import { z } from 'zod';
import {
  INSTRUMENT_CATEGORY_LIST,
  ACCURACY_CLASS_LIST,
} from '../config/constants.js';

export const createInstrumentSchema = z.object({
  category: z.enum(INSTRUMENT_CATEGORY_LIST, {
    errorMap: () => ({ message: 'Invalid instrument category' }),
  }),
  instrumentType: z.string().min(2, 'Instrument type/model specification is required'),
  manufacturer: z.string().min(2, 'Manufacturer name is required'),
  modelNumber: z.string().min(1, 'Model number is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  capacity: z.object({
    value: z.number().positive('Capacity value must be greater than 0'),
    unit: z.string().min(1, 'Capacity unit is required (e.g., kg, tonnes, g)'),
  }),
  accuracyClass: z.enum(ACCURACY_CLASS_LIST, {
    errorMap: () => ({ message: 'Invalid accuracy class' }),
  }),
  verificationScaleInterval_e: z.string().min(1, 'Verification scale interval (e) is required'),
  minimumCapacity_Min: z.string().optional(),
  dateOfManufacture: z.string().optional(),
  verificationFrequencyMonths: z.number().int().positive().optional(),
  remarks: z.string().optional(),
  stakeholderId: z.string().optional(),
  installationAddress: z.object({
    premiseName: z.string().min(2, 'Premise/shop name is required'),
    addressLine: z.string().min(3, 'Address line is required'),
    city: z.string().min(2, 'City is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Valid 6-digit PIN code is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

export const updateInstrumentSchema = createInstrumentSchema.partial().passthrough();
