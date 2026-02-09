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
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters'),
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
 * Update user form validation schema
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
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
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
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
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
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
});

export type CreateBusinessTypeFormData = z.infer<typeof createBusinessTypeSchema>;

export const updateBusinessTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
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
  user_name: z.string().min(1, 'User name is required').max(255),
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
  contact_phone: z.string().max(20).optional().nullable(),
  address: addressSchema.optional().nullable(),
});

export type UpdateMerchantFormData = z.infer<typeof updateMerchantSchema>;

export const updateMerchantStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'active', 'rejected', 'suspended']),
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
  name: z.string().min(1, 'Name is required').max(255),
  service_category_id: z.number().int().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0, 'Price must be 0 or more'),
  is_active: z.boolean().optional(),
});

export type CreateServiceFormData = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  service_category_id: z.number().int().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0, 'Price must be 0 or more').optional(),
  is_active: z.boolean().optional(),
});

export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>;
