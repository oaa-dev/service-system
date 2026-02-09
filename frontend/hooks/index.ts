// Auth hooks
export {
  useRegister,
  useLogin,
  useLogout,
  useMe,
  useUpdateMe,
} from './useAuth';

// User hooks
export {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from './useUsers';

// Profile hooks
export {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from './useProfile';

// Messaging hooks
export {
  useConversations,
  useConversation,
  useStartConversation,
  useDeleteConversation,
  useMessages,
  useSendMessage,
  useMarkConversationAsRead,
  useMessagesUnreadCount,
  useSearchMessages,
  useDeleteMessage,
  useRealtimeMessaging,
} from './useMessaging';

// Payment Method hooks
export {
  usePaymentMethods,
  useAllPaymentMethods,
  useActivePaymentMethods,
  usePaymentMethod,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from './usePaymentMethods';

// Document Type hooks
export {
  useDocumentTypes,
  useAllDocumentTypes,
  useActiveDocumentTypes,
  useDocumentType,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
} from './useDocumentTypes';

// Business Type hooks
export {
  useBusinessTypes,
  useAllBusinessTypes,
  useActiveBusinessTypes,
  useBusinessType,
  useCreateBusinessType,
  useUpdateBusinessType,
  useDeleteBusinessType,
} from './useBusinessTypes';

// Social Platform hooks
export {
  useSocialPlatforms,
  useAllSocialPlatforms,
  useActiveSocialPlatforms,
  useSocialPlatform,
  useCreateSocialPlatform,
  useUpdateSocialPlatform,
  useDeleteSocialPlatform,
} from './useSocialPlatforms';

// Merchant hooks
export {
  useMerchants,
  useAllMerchants,
  useMerchant,
  useCreateMerchant,
  useUpdateMerchant,
  useDeleteMerchant,
  useUpdateMerchantStatus,
  useUploadMerchantLogo,
  useDeleteMerchantLogo,
  useUpdateBusinessHours,
  useSyncMerchantPaymentMethods,
  useSyncMerchantSocialLinks,
  useUploadMerchantDocument,
  useDeleteMerchantDocument,
} from './useMerchants';
