import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(255),
    last_name: z.string().min(1, 'Last name is required').max(255),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'Please enter all 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

export const bookingSchema = z.object({
  service_id: z.number({ error: 'Please select a service' }),
  booking_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Time is required'),
  party_size: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});
export type BookingFormData = z.infer<typeof bookingSchema>;

export const reservationSchema = z.object({
  service_id: z.number({ error: 'Please select a unit' }),
  check_in: z.string().min(1, 'Check-in date is required'),
  check_out: z.string().min(1, 'Check-out date is required'),
  guest_count: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  special_requests: z.string().optional(),
});
export type ReservationFormData = z.infer<typeof reservationSchema>;

export const orderSchema = z.object({
  service_id: z.number({ error: 'Please select a product' }),
  quantity: z.number({ error: 'Quantity is required' }).min(0.01, 'Quantity must be greater than 0'),
  unit_label: z.string().min(1, 'Unit label is required').max(50),
  notes: z.string().optional(),
});
export type OrderFormData = z.infer<typeof orderSchema>;
