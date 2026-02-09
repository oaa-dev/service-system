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
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

// User Types

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  avatar?: Avatar | null;
  profile?: Profile | null;
  roles?: string[];
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  name?: string;
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
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

// Profile Types

export interface Profile {
  id: number;
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
  icon: MediaIcon | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateBusinessTypeRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateBusinessTypeRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
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
  user?: User;
  business_type?: BusinessType;
  address?: Address | null;
  parent?: { id: number; name: string } | null;
  payment_methods?: PaymentMethod[];
  social_links?: MerchantSocialLink[];
  documents?: MerchantDocument[];
  logo: MediaLogo | null;
  created_at: string | null;
  updated_at: string | null;
}

export type MerchantStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';

export interface CreateMerchantRequest {
  user_name: string;
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

// Service Types (Merchant Sub-Entity)

export interface Service {
  id: number;
  merchant_id: number;
  service_category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  is_active: boolean;
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
}

export interface UpdateServiceRequest {
  name?: string;
  service_category_id?: number | null;
  description?: string | null;
  price?: number;
  is_active?: boolean;
}

export interface ServiceQueryParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[name]'?: string;
  'filter[service_category_id]'?: string;
  'filter[is_active]'?: string;
}
