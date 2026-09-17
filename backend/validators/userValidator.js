import { z } from 'zod';
import { USER_ROLE_LIST } from '../config/constants.js';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().min(10, 'Mobile phone number must be at least 10 digits'),
  role: z.enum(USER_ROLE_LIST, {
    errorMap: () => ({ message: 'Invalid role specified' }),
  }),
  designation: z.string().optional(),
  jurisdiction: z
    .object({
      state: z.string().min(1, 'State is required'),
      district: z.string().min(1, 'District is required'),
      zone: z.string().optional(),
    })
    .optional(),
  organization: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address').transform((e) => e.toLowerCase().trim()).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  phone: z.string().min(10, 'Mobile phone number must be at least 10 digits').optional(),
  role: z.enum(USER_ROLE_LIST).optional(),
  designation: z.string().optional(),
  jurisdiction: z
    .object({
      state: z.string().optional(),
      district: z.string().optional(),
      zone: z.string().optional(),
    })
    .optional(),
  organization: z.string().optional(),
  isActive: z.boolean().optional(),
});
