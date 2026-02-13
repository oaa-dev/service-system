// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Auth Types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface VerifyOtpRequest {
  otp: string;
}

export interface VerificationStatusResponse {
  is_verified: boolean;
  can_resend: boolean;
  locked_until: string | null;
  expires_at: string | null;
}

// User Types

export interface User {
  id: number;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  email_verified_at: string | null;
  is_email_verified?: boolean;
  has_merchant?: boolean;
  merchant?: Merchant | null;
  avatar?: Avatar | null;
  profile?: Profile | null;
  roles?: string[];
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  roles?: string[];
}

// Role Types

export interface Role {
  id: number;
  name: string;
  permissions?: string[];
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name: string;
  permissions?: string[];
}

export interface SyncPermissionsRequest {
  permissions: string[];
}

export interface SyncRolesRequest {
  roles: string[];
}

// Permission Types

export interface Permission {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionGroup {
  [module: string]: {
    id: number;
    name: string;
    action: string;
  }[];
}

// Role Query Params
export interface RoleQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
}

export interface UpdateAuthUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

// Profile Types

export interface Profile {
  id: number;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone: string | null;
  address: Address | null;
  avatar: Avatar | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  bio?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  address?: AddressInput | null;
}

// Address Types

export interface GeoReference {
  id: number;
  name: string;
}

export interface Address {
  street: string | null;
  postal_code: string | null;
  region: GeoReference | null;
  province: GeoReference | null;
  city: GeoReference | null;
  barangay: GeoReference | null;
}

export interface AddressInput {
  street?: string;
  region_id?: number | null;
  province_id?: number | null;
  city_id?: number | null;
  barangay_id?: number | null;
  postal_code?: string;
}

// Geographic Types (PSGC)

export interface GeoRegion {
  id: number;
  code: string;
  name: string;
  region_name: string;
}

export interface GeoProvince {
  id: number;
  code: string;
  name: string;
  is_district: boolean;
}

export interface GeoCity {
  id: number;
  code: string;
  name: string;
  is_city: boolean;
  is_municipality: boolean;
  is_capital: boolean;
}

export interface GeoBarangay {
  id: number;
  code: string;
  name: string;
}

// Avatar Types

export interface Avatar {
  original: string;
  thumb: string;
  preview: string;
}

// Query Params

export interface UserQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string; // Global search across name and email
  'filter[name]'?: string;
  'filter[email]'?: string;
  'filter[status]'?: 'verified' | 'unverified' | '';
  'filter[created_from]'?: string;
  'filter[created_to]'?: string;
}

// Generic filter types for reusable components
export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange';
  placeholder?: string;
  options?: FilterOption[];
}

// Notification Types

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationQueryParams {
  page?: number;
  per_page?: number;
}

// Messaging Types

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender?: MessageSender;
  body: string;
  read_at: string | null;
  is_mine: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageSender {
  id: number;
  name: string;
  avatar: Avatar | null;
}

export interface Conversation {
  id: number;
  other_user: MessageSender;
  latest_message: Message | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StartConversationRequest {
  recipient_id: number;
  message?: string;
}

export interface SendMessageRequest {
  body: string;
}

export interface ConversationQueryParams {
  page?: number;
  per_page?: number;
}

export interface MessageQueryParams {
  page?: number;
  per_page?: number;
}

export interface MessageSearchParams {
  q: string;
  page?: number;
  per_page?: number;
}

// Real-time message event from WebSocket
export interface MessageSentEvent {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: MessageSender;
  body: string;
  read_at: string | null;
  created_at: string;
}

// Real-time conversation update event from WebSocket
export interface ConversationUpdatedEvent {
  id: number;
  last_message_at: string | null;
  latest_message: {
    id: number;
    body: string;
    sender_id: number;
    created_at: string;
  } | null;
}

// Payment Method Types

export interface PaymentMethod {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  icon: MediaIcon | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreatePaymentMethodRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdatePaymentMethodRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface PaymentMethodQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[is_active]'?: string;
}

// Document Type Types

export interface DocumentType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_required: boolean;
  level: 'organization' | 'branch' | 'both';
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateDocumentTypeRequest {
  name: string;
  description?: string | null;
  is_required?: boolean;
  level?: 'organization' | 'branch' | 'both';
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateDocumentTypeRequest {
  name?: string;
  description?: string | null;
  is_required?: boolean;
  level?: 'organization' | 'branch' | 'both';
  is_active?: boolean;
  sort_order?: number;
}

export interface DocumentTypeQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[is_active]'?: string;
}

// Business Type Types

export interface BusinessType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  can_sell_products: boolean;
  can_take_bookings: boolean;
  can_rent_units: boolean;
  icon: MediaIcon | null;
  fields?: BusinessTypeField[];
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateBusinessTypeRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  can_sell_products?: boolean;
  can_take_bookings?: boolean;
  can_rent_units?: boolean;
}

export interface UpdateBusinessTypeRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  can_sell_products?: boolean;
  can_take_bookings?: boolean;
  can_rent_units?: boolean;
}

export interface BusinessTypeQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[is_active]'?: string;
}

// Social Platform Types

export interface SocialPlatform {
  id: number;
  name: string;
  slug: string;
  base_url: string;
  is_active: boolean;
  sort_order: number;
  icon: MediaIcon | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateSocialPlatformRequest {
  name: string;
  base_url: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateSocialPlatformRequest {
  name?: string;
  base_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface SocialPlatformQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[is_active]'?: string;
}

// Service Category Types

export interface ServiceCategory {
  id: number;
  merchant_id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateServiceCategoryRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateServiceCategoryRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface ServiceCategoryQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[is_active]'?: string;
}

// Media Types (shared)

export interface MediaIcon {
  url: string;
  thumb: string;
}

export interface MediaLogo {
  url: string;
  thumb: string;
  preview: string;
}

export interface MediaFile {
  url: string;
  name: string;
  size: number;
  mime_type: string;
}

// Merchant Types

export interface Merchant {
  id: number;
  user_id: number;
  parent_id: number | null;
  business_type_id: number | null;
  type: 'individual' | 'organization';
  name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  status: MerchantStatus;
  status_changed_at: string | null;
  status_reason: string | null;
  approved_at: string | null;
  accepted_terms_at: string | null;
  terms_version: string | null;
  can_sell_products: boolean;
  can_take_bookings: boolean;
  can_rent_units: boolean;
  user?: User;
  business_type?: BusinessType;
  address?: Address | null;
  parent?: { id: number; name: string } | null;
  payment_methods?: PaymentMethod[];
  social_links?: MerchantSocialLink[];
  documents?: MerchantDocument[];
  business_hours?: MerchantBusinessHour[];
  logo: MediaLogo | null;
  created_at: string | null;
  updated_at: string | null;
}

export type MerchantStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';

export interface CreateMerchantRequest {
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_password: string;
  parent_id?: number | null;
  business_type_id?: number | null;
  type?: 'individual' | 'organization';
  name: string;
  description?: string | null;
  contact_phone?: string | null;
}

export interface UpdateMerchantRequest {
  parent_id?: number | null;
  business_type_id?: number | null;
  type?: 'individual' | 'organization';
  name?: string;
  description?: string | null;
  contact_phone?: string | null;
  address?: AddressInput | null;
  can_sell_products?: boolean;
  can_take_bookings?: boolean;
  can_rent_units?: boolean;
}

export interface UpdateMerchantAccountRequest {
  email?: string;
  password?: string;
}

export interface UpdateMerchantStatusRequest {
  status: MerchantStatus;
  status_reason?: string;
}

export interface MerchantQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[status]'?: MerchantStatus | '';
  'filter[type]'?: 'individual' | 'organization' | '';
}

// Merchant Business Hour Types

export interface MerchantBusinessHour {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface UpdateBusinessHoursRequest {
  hours: {
    day_of_week: number;
    open_time?: string | null;
    close_time?: string | null;
    is_closed: boolean;
  }[];
}

// Merchant Social Link Types

export interface MerchantSocialLink {
  id: number;
  social_platform_id: number;
  url: string;
  social_platform?: SocialPlatform;
}

export interface SyncSocialLinksRequest {
  social_links: {
    social_platform_id: number;
    url: string;
  }[];
}

// Merchant Document Types

export interface MerchantDocument {
  id: number;
  document_type_id: number;
  notes: string | null;
  document_type?: DocumentType;
  file: MediaFile | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SyncPaymentMethodsRequest {
  payment_method_ids: number[];
}

// Merchant Gallery Types

export interface GalleryImage {
  id: number;
  url: string;
  thumb: string;
  preview: string;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export interface MerchantGallery {
  gallery_photos: GalleryImage[];
  gallery_interiors: GalleryImage[];
  gallery_exteriors: GalleryImage[];
  gallery_feature: GalleryImage | null;
}

export type GalleryCollection = 'photos' | 'interiors' | 'exteriors' | 'feature';

// Merchant Stats Types (My Merchant Dashboard)

export interface MerchantStats {
  services: {
    total: number;
    active: number;
  };
  bookings?: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    today: number;
  };
  orders?: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    today: number;
  };
  reservations?: {
    total: number;
    pending: number;
    confirmed: number;
    checked_in: number;
    checked_out: number;
    cancelled: number;
    today: number;
  };
  recent_bookings?: Booking[];
  recent_orders?: ServiceOrder[];
  recent_reservations?: Reservation[];
}

// Service Types (Merchant Sub-Entity)

export type ServiceType = 'sellable' | 'bookable' | 'reservation';
export type UnitStatus = 'available' | 'occupied' | 'maintenance';

export interface Service {
  id: number;
  merchant_id: number;
  service_category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  is_active: boolean;
  service_type: ServiceType;
  // sellable fields
  sku: string | null;
  stock_quantity: number | null;
  track_stock: boolean;
  // bookable fields
  duration: number | null;
  max_capacity: number;
  requires_confirmation: boolean;
  // reservation fields
  price_per_night: string | null;
  floor: string | null;
  unit_status: UnitStatus;
  amenities: string[] | null;
  // custom fields
  custom_fields?: BusinessTypeFieldValue[];
  service_category?: ServiceCategory | null;
  image?: {
    url: string;
    thumb: string;
    preview: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateServiceRequest {
  name: string;
  service_category_id?: number | null;
  description?: string | null;
  price: number;
  is_active?: boolean;
  service_type: ServiceType;
  sku?: string | null;
  stock_quantity?: number | null;
  track_stock?: boolean;
  duration?: number | null;
  max_capacity?: number;
  requires_confirmation?: boolean;
  price_per_night?: number | null;
  floor?: string | null;
  unit_status?: UnitStatus;
  amenities?: string[] | null;
  custom_fields?: Record<string, string | number | number[]>;
}

export interface UpdateServiceRequest {
  name?: string;
  service_category_id?: number | null;
  description?: string | null;
  price?: number;
  is_active?: boolean;
  service_type?: ServiceType;
  sku?: string | null;
  stock_quantity?: number | null;
  track_stock?: boolean;
  duration?: number | null;
  max_capacity?: number;
  requires_confirmation?: boolean;
  price_per_night?: number | null;
  floor?: string | null;
  unit_status?: UnitStatus;
  amenities?: string[] | null;
  custom_fields?: Record<string, string | number | number[]>;
}

export interface ServiceQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[service_category_id]'?: string;
  'filter[is_active]'?: string;
  'filter[service_type]'?: string;
}

export interface ServiceSchedule {
  id: number;
  service_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface UpdateServiceScheduleRequest {
  schedules: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[];
}

// Booking Types

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: number;
  merchant_id: number;
  service_id: number;
  customer_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  service_price: string;
  fee_rate: string;
  fee_amount: string;
  total_amount: string;
  status: BookingStatus;
  notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  service?: Service;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateBookingRequest {
  service_id: number;
  booking_date: string;
  start_time: string;
  party_size?: number;
  notes?: string | null;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
}

export interface BookingQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[status]'?: string;
  'filter[service_id]'?: string;
  'filter[date_from]'?: string;
  'filter[date_to]'?: string;
  'filter[search]'?: string;
}

// Field Types

export type FieldType = 'input' | 'select' | 'checkbox' | 'radio';

export interface FieldValue {
  id: number;
  field_id: number;
  label: string;
  value: string;
  sort_order: number;
}

export interface Field {
  id: number;
  label: string;
  name: string;
  type: FieldType;
  config: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  values: FieldValue[];
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateFieldRequest {
  label: string;
  name?: string;
  type: FieldType;
  config?: Record<string, unknown> | null;
  is_active?: boolean;
  sort_order?: number;
  values?: { value: string; sort_order?: number }[];
}

export interface UpdateFieldRequest {
  label?: string;
  name?: string;
  type?: FieldType;
  config?: Record<string, unknown> | null;
  is_active?: boolean;
  sort_order?: number;
  values?: { value: string; sort_order?: number }[];
}

export interface FieldQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[type]'?: string;
  'filter[is_active]'?: string;
}

// BusinessType Field Types

export interface BusinessTypeField {
  id: number;
  business_type_id: number;
  field_id: number;
  is_required: boolean;
  sort_order: number;
  field?: Field;
}

export interface SyncBusinessTypeFieldsRequest {
  fields: { field_id: number; is_required?: boolean; sort_order?: number }[];
}

export interface BusinessTypeFieldValue {
  id: number;
  service_id: number;
  business_type_field_id: number;
  field_value_id: number | null;
  value: string | null;
  field_value?: FieldValue;
  business_type_field?: BusinessTypeField;
}

// Customer Tag Types

export interface CustomerTag {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCustomerTagRequest {
  name: string;
  color?: string | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateCustomerTagRequest {
  name?: string;
  color?: string | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface CustomerTagQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[is_active]'?: string;
}

// Customer Types

export type CustomerType = 'individual' | 'corporate';
export type CustomerTier = 'regular' | 'silver' | 'gold' | 'platinum';
export type CustomerStatus = 'active' | 'suspended' | 'banned';
export type CustomerPaymentMethod = 'cash' | 'e-wallet' | 'card';
export type CustomerCommunicationPreference = 'sms' | 'email' | 'both';
export type CustomerInteractionType = 'note' | 'call' | 'complaint' | 'inquiry';

export interface Customer {
  id: number;
  user?: { id: number; name: string; email: string; profile?: Profile | null };
  customer_type: CustomerType;
  company_name: string | null;
  customer_notes: string | null;
  loyalty_points: number;
  customer_tier: CustomerTier;
  preferred_payment_method: CustomerPaymentMethod | null;
  communication_preference: CustomerCommunicationPreference;
  status: CustomerStatus;
  tags?: CustomerTag[];
  documents?: CustomerDocument[];
  interactions_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCustomerRequest {
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_password: string;
  customer_type?: CustomerType;
  company_name?: string | null;
}

export interface UpdateCustomerRequest {
  customer_type?: CustomerType;
  company_name?: string | null;
  customer_notes?: string | null;
  loyalty_points?: number;
  customer_tier?: CustomerTier;
  preferred_payment_method?: CustomerPaymentMethod | null;
  communication_preference?: CustomerCommunicationPreference;
}

export interface UpdateCustomerStatusRequest {
  status: CustomerStatus;
}

export interface SyncCustomerTagsRequest {
  tag_ids: number[];
}

export interface CustomerQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[customer_type]'?: CustomerType | '';
  'filter[customer_tier]'?: CustomerTier | '';
  'filter[status]'?: CustomerStatus | '';
  'filter[tag_id]'?: string;
}

// Customer Interaction Types

export interface CustomerInteraction {
  id: number;
  type: CustomerInteractionType;
  description: string;
  logged_by?: { id: number; name: string };
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCustomerInteractionRequest {
  type: CustomerInteractionType;
  description: string;
}

export interface CustomerInteractionQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[type]'?: CustomerInteractionType | '';
}

// Customer Preferences (self-service)

export interface UpdateCustomerPreferencesRequest {
  preferred_payment_method?: CustomerPaymentMethod | null;
  communication_preference?: CustomerCommunicationPreference;
}

export interface UpdateCustomerProfileRequest {
  bio?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  address?: AddressInput | null;
}

export interface UpdateCustomerAccountRequest {
  email?: string;
  password?: string;
}

export interface CustomerDocument {
  id: number;
  document_type_id: number;
  notes: string | null;
  document_type?: DocumentType;
  file: MediaFile | null;
  created_at: string | null;
  updated_at: string | null;
}

// Reservation Types

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Reservation {
  id: number;
  merchant_id: number;
  service_id: number;
  customer_id: number;
  check_in: string;
  check_out: string;
  guest_count: number;
  nights: number;
  price_per_night: string;
  total_price: string;
  fee_rate: string;
  fee_amount: string;
  total_amount: string;
  status: ReservationStatus;
  notes: string | null;
  special_requests: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  service?: Service;
  customer?: { id: number; name: string; email: string };
  created_at: string;
  updated_at: string;
}

export interface CreateReservationRequest {
  service_id: number;
  check_in: string;
  check_out: string;
  guest_count?: number;
  notes?: string;
  special_requests?: string;
}

export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
}

export interface ReservationQueryParams {
  page?: number;
  per_page?: number;
  'filter[status]'?: string;
  'filter[service_id]'?: number;
  'filter[date_from]'?: string;
  'filter[date_to]'?: string;
  sort?: string;
}

// Service Order Types

export type ServiceOrderStatus = 'pending' | 'received' | 'processing' | 'ready' | 'delivering' | 'completed' | 'cancelled';

export interface ServiceOrder {
  id: number;
  merchant_id: number;
  service_id: number;
  customer_id: number;
  order_number: string;
  quantity: string;
  unit_label: string;
  unit_price: string;
  total_price: string;
  fee_rate: string;
  fee_amount: string;
  total_amount: string;
  status: ServiceOrderStatus;
  notes: string | null;
  estimated_completion: string | null;
  received_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  service?: Service;
  customer?: { id: number; name: string; email: string };
  created_at: string;
  updated_at: string;
}

export interface CreateServiceOrderRequest {
  service_id: number;
  quantity: number;
  unit_label: string;
  notes?: string;
}

export interface UpdateServiceOrderStatusRequest {
  status: ServiceOrderStatus;
}

export interface ServiceOrderQueryParams {
  page?: number;
  per_page?: number;
  'filter[status]'?: string;
  'filter[service_id]'?: number;
  'filter[date_from]'?: string;
  'filter[date_to]'?: string;
  'filter[search]'?: string;
  sort?: string;
}

// Platform Fee Types

export type PlatformFeeTransactionType = 'booking' | 'reservation' | 'sell_product';

export interface PlatformFee {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  transaction_type: PlatformFeeTransactionType;
  rate_percentage: string;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreatePlatformFeeRequest {
  name: string;
  description?: string | null;
  transaction_type: PlatformFeeTransactionType;
  rate_percentage: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdatePlatformFeeRequest {
  name?: string;
  description?: string | null;
  transaction_type?: PlatformFeeTransactionType;
  rate_percentage?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface PlatformFeeQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[is_active]'?: string;
  'filter[transaction_type]'?: string;
}
