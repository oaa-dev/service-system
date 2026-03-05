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
  useMessages,
  useSendMessage,
  useMarkConversationAsRead,
  useMessagesUnreadCount,
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

// Review hooks
export {
  useReviews,
  useToggleReviewPublish,
  useUpdateReviewNotes,
  useMyMerchantReviews,
  useReplyToReview,
  useUpdateReply,
  useDeleteReply,
} from './useReviews';

// Booking Slot hooks
export {
  useBookingSlots,
  useCreateBookingSlot,
  useUpdateBookingSlot,
  useDeleteBookingSlot,
} from './useBookingSlots';

// Loyalty hooks
export {
  useMyLoyaltyProgram,
  useUpsertLoyaltyProgram,
  useDeactivateLoyaltyProgram,
  useGenerateLoyaltyQr,
  useLoyaltyCards,
  useLoyaltyCard,
  useAwardBonusStamp,
  loyaltyKeys,
} from './useLoyalty';

// Referral hooks
export {
  useMyReferralProgram,
  useCreateOrUpdateReferralProgram,
  useDeactivateReferralProgram,
  useMerchantReferrals,
  useReferralStats,
  useAdminReferralProgram,
  useUpdateAdminReferralProgram,
  referralKeys,
} from './useReferrals';

// Payment hooks
export {
  usePayment,
  useMarkAsPaid,
  useRequestRefund,
  useMarkRefunded,
  useCheckPaymentStatus,
} from './usePayments';

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
