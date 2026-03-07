import api from '@/lib/axios';
import {
  ApiResponse,
  CustomerProfileData,
  CustomerRecord,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UpdatePreferencesPayload,
  UserProfile,
  PaymentMethod,
} from '@/types/api';

export async function getMyProfile(): Promise<ApiResponse<CustomerProfileData>> {
  return api.get<ApiResponse<CustomerProfileData>>('/profile').then(r => r.data);
}

export async function updateMyProfile(
  data: Partial<UpdateProfilePayload>,
): Promise<ApiResponse<CustomerProfileData>> {
  return api.put<ApiResponse<CustomerProfileData>>('/profile', data).then(r => r.data);
}

export async function uploadAvatar(
  file: File,
): Promise<ApiResponse<{ avatar: UserProfile['avatar'] }>> {
  const formData = new FormData();
  formData.append('avatar', file);
  return api
    .post<ApiResponse<{ avatar: UserProfile['avatar'] }>>('/profile/avatar', formData)
    .then(r => r.data);
}

export async function deleteAvatar(): Promise<ApiResponse<null>> {
  return api.delete<ApiResponse<null>>('/profile/avatar').then(r => r.data);
}

export async function changePassword(data: ChangePasswordPayload): Promise<ApiResponse<null>> {
  return api.put<ApiResponse<null>>('/profile/password', data).then(r => r.data);
}

export async function getMyCustomerRecord(): Promise<ApiResponse<CustomerRecord>> {
  return api.get<ApiResponse<CustomerRecord>>('/profile/customer').then(r => r.data);
}

export async function updateMyPreferences(
  data: UpdatePreferencesPayload,
): Promise<ApiResponse<CustomerRecord>> {
  return api.put<ApiResponse<CustomerRecord>>('/profile/customer', data).then(r => r.data);
}

export interface PaymentMethodsResponse {
  methods: PaymentMethod[];
  preferred: string | null;
}

export async function getMyPaymentMethods(): Promise<ApiResponse<PaymentMethodsResponse>> {
  return api
    .get<ApiResponse<PaymentMethodsResponse>>('/customer/my/payment-methods')
    .then(r => r.data);
}

export async function updateMyPaymentPreference(
  preferred_payment_method: string | null,
): Promise<ApiResponse<{ preferred_payment_method: string | null }>> {
  return api
    .put<ApiResponse<{ preferred_payment_method: string | null }>>('/customer/my/payment-preferences', {
      preferred_payment_method,
    })
    .then(r => r.data);
}

export async function uploadIdentityDocument(
  file: File,
): Promise<ApiResponse<CustomerRecord>> {
  const formData = new FormData();
  formData.append('document', file);
  return api
    .post<ApiResponse<CustomerRecord>>('/customer/my/identity-document', formData)
    .then(r => r.data);
}
