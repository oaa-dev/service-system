import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Register form validation schema
 */
export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, 'First name is required')
      .max(255, 'First name must be less than 255 characters'),
    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(255, 'Last name must be less than 255 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .max(255, 'Email must be less than 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    password_confirmation: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * OTP verification form validation schema
 */
export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'Please enter all 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

/**
 * Update user form validation schema
 */
export const updateUserSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(255)
    .optional(),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(255)
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
  roles: z.array(z.string()).optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

/**
 * Create user form validation schema
 */
export const createUserSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(255),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(255),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  roles: z.array(z.string()).optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  street: z.string().max(255).optional().nullable(),
  region_id: z.number().optional().nullable(),
  province_id: z.number().optional().nullable(),
  city_id: z.number().optional().nullable(),
  barangay_id: z.number().optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

/**
 * Update profile form validation schema
 */
export const updateProfileSchema = z.object({
  bio: z
    .string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .nullable(),
  date_of_birth: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return date < new Date();
      },
      { message: 'Date of birth must be in the past' }
    ),
  gender: z
    .enum(['male', 'female', 'other'])
    .optional()
    .nullable(),
  address: addressSchema.optional().nullable(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

/**
 * Avatar upload validation
 */
export const avatarSchema = z.object({
  avatar: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be JPEG, PNG, or WebP'
    ),
});

export type AvatarFormData = z.infer<typeof avatarSchema>;

/**
 * Update account form validation schema
 */
export const updateAccountSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(255),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(255),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
});

export type UpdateAccountFormData = z.infer<typeof updateAccountSchema>;

/**
 * Create role form validation schema
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(255, 'Role name must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Role name must be lowercase alphanumeric with dashes only'),
  permissions: z.array(z.string()).optional(),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;

/**
 * Update role form validation schema
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(255, 'Role name must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Role name must be lowercase alphanumeric with dashes only'),
  permissions: z.array(z.string()).optional(),
});

export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

/**
 * Sync roles form validation schema
 */
export const syncRolesSchema = z.object({
  roles: z.array(z.string()).min(1, 'At least one role is required'),
});

export type SyncRolesFormData = z.infer<typeof syncRolesSchema>;

/**
 * Payment Method schemas
 */
export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreatePaymentMethodFormData = z.infer<typeof createPaymentMethodSchema>;

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type UpdatePaymentMethodFormData = z.infer<typeof updatePaymentMethodSchema>;

/**
 * Document Type schemas
 */
export const createDocumentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  is_required: z.boolean().optional(),
  level: z.enum(['organization', 'branch', 'both']).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateDocumentTypeFormData = z.infer<typeof createDocumentTypeSchema>;

export const updateDocumentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_required: z.boolean().optional(),
  level: z.enum(['organization', 'branch', 'both']).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type UpdateDocumentTypeFormData = z.infer<typeof updateDocumentTypeSchema>;

/**
 * Business Type schemas
 */
export const createBusinessTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  can_sell_products: z.boolean().optional(),
  can_take_bookings: z.boolean().optional(),
  can_rent_units: z.boolean().optional(),
});

export type CreateBusinessTypeFormData = z.infer<typeof createBusinessTypeSchema>;

export const updateBusinessTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  can_sell_products: z.boolean().optional(),
  can_take_bookings: z.boolean().optional(),
  can_rent_units: z.boolean().optional(),
});

export type UpdateBusinessTypeFormData = z.infer<typeof updateBusinessTypeSchema>;

/**
 * Social Platform schemas
 */
export const createSocialPlatformSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  base_url: z.string().min(1, 'Base URL is required').url('Invalid URL'),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateSocialPlatformFormData = z.infer<typeof createSocialPlatformSchema>;

export const updateSocialPlatformSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  base_url: z.string().url('Invalid URL').optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type UpdateSocialPlatformFormData = z.infer<typeof updateSocialPlatformSchema>;

/**
 * Merchant schemas
 */
export const createMerchantSchema = z.object({
  user_first_name: z.string().min(1, 'First name is required').max(255),
  user_last_name: z.string().min(1, 'Last name is required').max(255),
  user_email: z.string().min(1, 'User email is required').email('Invalid email').max(255),
  user_password: z.string().min(8, 'Password must be at least 8 characters'),
  parent_id: z.number().int().optional().nullable(),
  business_type_id: z.number().int().optional().nullable(),
  type: z.enum(['individual', 'organization']).optional(),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  contact_phone: z.string().max(20).optional().nullable(),
});

export type CreateMerchantFormData = z.infer<typeof createMerchantSchema>;

export const updateMerchantSchema = z.object({
  parent_id: z.number().int().optional().nullable(),
  business_type_id: z.number().int().optional().nullable(),
  type: z.enum(['individual', 'organization']).optional(),
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().optional().nullable(),
  contact_email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  contact_phone: z.string().max(20).optional().nullable(),
  address: addressSchema.optional().nullable(),
  can_sell_products: z.boolean().optional(),
  can_take_bookings: z.boolean().optional(),
  can_rent_units: z.boolean().optional(),
});

export type UpdateMerchantFormData = z.infer<typeof updateMerchantSchema>;

export const updateMerchantStatusSchema = z.object({
  status: z.enum(['pending', 'submitted', 'approved', 'active', 'rejected', 'suspended']),
  status_reason: z.string().max(1000).optional(),
});

export type UpdateMerchantStatusFormData = z.infer<typeof updateMerchantStatusSchema>;

/**
 * Service Category schemas
 */
export const createServiceCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateServiceCategoryFormData = z.infer<typeof createServiceCategorySchema>;

export const updateServiceCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type UpdateServiceCategoryFormData = z.infer<typeof updateServiceCategorySchema>;

/**
 * Service schemas (Merchant sub-entity)
 */
export const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  service_category_id: z.number().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().min(0),
  is_active: z.boolean().optional(),
  service_type: z.enum(['sellable', 'bookable', 'reservation']),
  // sellable fields
  sku: z.string().max(100).nullable().optional(),
  stock_quantity: z.number().int().min(0).nullable().optional(),
  track_stock: z.boolean().optional(),
  // bookable fields
  duration: z.number().int().min(5).max(1440).nullable().optional(),
  max_capacity: z.number().int().min(1).optional(),
  requires_confirmation: z.boolean().optional(),
  // reservation fields
  price_per_night: z.number().min(0).nullable().optional(),
  floor: z.string().max(50).nullable().optional(),
  unit_status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  amenities: z.array(z.string().max(255)).nullable().optional(),
});

export type CreateServiceFormData = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  service_category_id: z.number().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  // sellable fields
  sku: z.string().max(100).nullable().optional(),
  stock_quantity: z.number().int().min(0).nullable().optional(),
  track_stock: z.boolean().optional(),
  // bookable fields
  duration: z.number().int().min(5).max(1440).nullable().optional(),
  max_capacity: z.number().int().min(1).optional(),
  requires_confirmation: z.boolean().optional(),
  // reservation fields
  price_per_night: z.number().min(0).nullable().optional(),
  floor: z.string().max(50).nullable().optional(),
  unit_status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  amenities: z.array(z.string().max(255)).nullable().optional(),
});

export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>;

/**
 * Customer Tag schemas
 */
export const createCustomerTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  color: z.string().max(7).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreateCustomerTagFormData = z.infer<typeof createCustomerTagSchema>;

export const updateCustomerTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  color: z.string().max(7).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type UpdateCustomerTagFormData = z.infer<typeof updateCustomerTagSchema>;

/**
 * Customer schemas
 */
export const createCustomerSchema = z.object({
  user_first_name: z.string().min(1, 'First name is required').max(255),
  user_last_name: z.string().min(1, 'Last name is required').max(255),
  user_email: z.string().min(1, 'Email is required').email('Invalid email').max(255),
  user_password: z.string().min(8, 'Password must be at least 8 characters'),
  customer_type: z.enum(['individual', 'corporate']).optional(),
  company_name: z.string().max(255).optional().nullable(),
});

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  customer_type: z.enum(['individual', 'corporate']).optional(),
  company_name: z.string().max(255).optional().nullable(),
  customer_notes: z.string().max(5000).optional().nullable(),
  loyalty_points: z.number().int().min(0).optional(),
  customer_tier: z.enum(['regular', 'silver', 'gold', 'platinum']).optional(),
  preferred_payment_method: z.enum(['cash', 'e-wallet', 'card']).optional().nullable(),
  communication_preference: z.enum(['sms', 'email', 'both']).optional(),
});

export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;

export const updateCustomerStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
});

export type UpdateCustomerStatusFormData = z.infer<typeof updateCustomerStatusSchema>;

export const createCustomerInteractionSchema = z.object({
  type: z.enum(['note', 'call', 'complaint', 'inquiry']),
  description: z.string().min(1, 'Description is required').max(5000),
});

export type CreateCustomerInteractionFormData = z.infer<typeof createCustomerInteractionSchema>;

/**
 * Customer Preferences schema (self-service)
 */
export const updateCustomerPreferencesSchema = z.object({
  preferred_payment_method: z.enum(['cash', 'e-wallet', 'card']).optional().nullable(),
  communication_preference: z.enum(['sms', 'email', 'both']).optional(),
});

export type UpdateCustomerPreferencesFormData = z.infer<typeof updateCustomerPreferencesSchema>;

/**
 * Update customer profile schema (admin updating customer's user profile)
 */
export const updateCustomerProfileSchema = z.object({
  bio: z
    .string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .nullable(),
  date_of_birth: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return date < new Date();
      },
      { message: 'Date of birth must be in the past' }
    ),
  gender: z
    .enum(['male', 'female', 'other'])
    .optional()
    .nullable(),
  address: addressSchema.optional().nullable(),
});

export type UpdateCustomerProfileFormData = z.infer<typeof updateCustomerProfileSchema>;

/**
 * Booking schemas
 */
export const createBookingSchema = z.object({
  service_id: z.number().int().min(1, 'Service is required'),
  booking_date: z.string().min(1, 'Booking date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  party_size: z.number().int().min(1, 'Party size must be at least 1').optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;

/**
 * Reservation schemas
 */
export const createReservationSchema = z.object({
  service_id: z.number().int().min(1),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  guest_count: z.number().int().min(1).optional(),
  notes: z.string().max(2000).nullable().optional(),
  special_requests: z.string().max(2000).nullable().optional(),
});

export type CreateReservationFormData = z.infer<typeof createReservationSchema>;

/**
 * Service Order schemas
 */
export const createServiceOrderSchema = z.object({
  service_id: z.number().int().min(1, 'Service is required'),
  quantity: z.number().min(0.01, 'Quantity must be at least 0.01'),
  unit_label: z.string().min(1, 'Unit label is required').max(50),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateServiceOrderFormData = z.infer<typeof createServiceOrderSchema>;

/**
 * Platform Fee schemas
 */
export const createPlatformFeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  transaction_type: z.enum(['booking', 'reservation', 'sell_product'], {
    message: 'Transaction type is required',
  }),
  rate_percentage: z.number().min(0, 'Rate must be 0 or more').max(100, 'Rate cannot exceed 100'),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type CreatePlatformFeeFormData = z.infer<typeof createPlatformFeeSchema>;

export const updatePlatformFeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  transaction_type: z.enum(['booking', 'reservation', 'sell_product']).optional(),
  rate_percentage: z.number().min(0, 'Rate must be 0 or more').max(100, 'Rate cannot exceed 100').optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type UpdatePlatformFeeFormData = z.infer<typeof updatePlatformFeeSchema>;

/**
 * Field schemas
 */
export const createFieldSchema = z.object({
  label: z.string().min(1).max(255),
  name: z.string().max(255).optional(),
  type: z.enum(['input', 'select', 'checkbox', 'radio']),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  values: z.array(z.object({
    value: z.string().min(1).max(255),
    sort_order: z.number().int().min(0).optional(),
  })).optional(),
});

export type CreateFieldFormData = z.infer<typeof createFieldSchema>;

export const updateFieldSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  name: z.string().max(255).optional(),
  type: z.enum(['input', 'select', 'checkbox', 'radio']).optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  values: z.array(z.object({
    value: z.string().min(1).max(255),
    sort_order: z.number().int().min(0).optional(),
  })).optional(),
});

export type UpdateFieldFormData = z.infer<typeof updateFieldSchema>;

/**
 * Branch schemas (self-service)
 */
export const createBranchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  user_name: z.string().min(1, 'Manager name is required').max(255),
  user_email: z.string().min(1, 'Login email is required').email('Invalid email').max(255),
  user_password: z.string().min(8, 'Password must be at least 8 characters'),
  description: z.string().optional().nullable(),
  contact_email: z.string().email('Invalid email').max(255).optional().nullable().or(z.literal('')),
  contact_phone: z.string().max(20).optional().nullable(),
  address: addressSchema.optional().nullable(),
  can_sell_products: z.boolean().optional(),
  can_take_bookings: z.boolean().optional(),
  can_rent_units: z.boolean().optional(),
});

export type CreateBranchFormData = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().optional().nullable(),
  contact_email: z.string().email('Invalid email').max(255).optional().nullable().or(z.literal('')),
  contact_phone: z.string().max(20).optional().nullable(),
  address: addressSchema.optional().nullable(),
  can_sell_products: z.boolean().optional(),
  can_take_bookings: z.boolean().optional(),
  can_rent_units: z.boolean().optional(),
});

export type UpdateBranchFormData = z.infer<typeof updateBranchSchema>;

/**
 * Merchant type selection form validation schema (onboarding)
 */
export const selectMerchantTypeSchema = z.object({
  type: z.enum(['individual', 'organization'], {
    message: 'Please select a merchant type',
  }),
  name: z.string().min(1, 'Business name is required').max(255),
});

export type SelectMerchantTypeFormData = z.infer<typeof selectMerchantTypeSchema>;
