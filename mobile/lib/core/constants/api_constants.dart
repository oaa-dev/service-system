class ApiConstants {
  ApiConstants._();

  static const String defaultBaseUrl = 'http://10.0.2.2:8090/api/v1';

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String verifyOtp = '/auth/verify-otp';
  static const String resendOtp = '/auth/resend-otp';
  static const String verificationStatus = '/auth/verification-status';

  // Storefront (public — no auth required)
  static const String storefrontMerchants = '/storefront/merchants';
  static String storefrontMerchant(String slug) => '/storefront/merchants/$slug';
  static String merchantBranches(String slug) => '/storefront/merchants/$slug/branches';
  static String merchantServices(String slug) => '/storefront/merchants/$slug/services';
  static String merchantReviews(String slug) => '/storefront/merchants/$slug/reviews';

  // Customer - Favorites (auth required)
  static const String myFavorites = '/customer/my/favorites';
  static String toggleFavorite(int merchantId) => '/customer/my/favorites/$merchantId';

  // Customer - Reviews (auth required)
  static String createReview(int merchantId) => '/customer/merchants/$merchantId/reviews';
  static const String myReviews = '/customer/reviews';
  static String updateReview(int reviewId) => '/customer/reviews/$reviewId';
  static String deleteReview(int reviewId) => '/customer/reviews/$reviewId';

  // Customer - Profile (auth required)
  static const String myProfile = '/profile';
  static const String uploadAvatar = '/profile/avatar';
  static const String deleteAvatar = '/profile/avatar';
  static const String changePassword = '/profile/change-password';
  static const String myPaymentMethods = '/customer/my/payment-methods';
  static const String paymentPreferences = '/customer/my/payment-preferences';

  // Customer - Dashboard (auth required)
  static const String myStats = '/customer/my/stats';

  // Customer - Bookings (auth required)
  static const String myBookings = '/customer/my/bookings';
  static String myBookingDetail(int id) => '/customer/my/bookings/$id';
  static String cancelBooking(int id) => '/customer/my/bookings/$id/cancel';

  // Customer - Reservations (auth required)
  static const String myReservations = '/customer/my/reservations';
  static String myReservationDetail(int id) => '/customer/my/reservations/$id';
  static String cancelReservation(int id) => '/customer/my/reservations/$id/cancel';

  // Customer - Orders (auth required)
  static const String myOrders = '/customer/my/orders';
  static String myOrderDetail(int id) => '/customer/my/orders/$id';
  static String cancelOrder(int id) => '/customer/my/orders/$id/cancel';

  // Storefront - Availability (public — no auth required)
  static String bookingAvailability(String slug, int serviceId) => '/storefront/merchants/$slug/services/$serviceId/booking-availability';
  static String reservationAvailability(String slug, int serviceId) => '/storefront/merchants/$slug/services/$serviceId/reservation-availability';

  // Storefront - Coupons (public — no auth required)
  static String merchantCoupons(String slug) => '/storefront/merchants/$slug/coupons';

  // Customer - Create Booking/Reservation/Order (auth required)
  static String createBooking(String slug) => '/customer/merchants/$slug/bookings';
  static String createReservation(String slug) => '/customer/merchants/$slug/reservations';
  static String createOrder(String slug) => '/customer/merchants/$slug/orders';

  // Customer - Loyalty (auth required)
  static const String myLoyaltyCards = '/customer/loyalty-cards';
  static String loyaltyCardDetail(int id) => '/customer/loyalty-cards/$id';
  static const String myLoyaltyRewards = '/customer/loyalty-rewards';
  static const String loyaltyScanQr = '/customer/loyalty/scan';

  // Customer - Coupons (auth required)
  static String claimCoupon(int id) => '/customer/coupons/$id/claim';
  static const String myClaimedCoupons = '/customer/coupons/claimed';

  // Customer - Referrals (auth required)
  static const String myReferralCodes = '/customer/referral-codes';
  static String generateReferralCode(int merchantId) => '/customer/referrals/generate/$merchantId';
  static const String myReferrals = '/customer/referrals';
  static const String myReferralRewards = '/customer/referral-rewards';
  static const String acceptReferral = '/customer/referrals/accept';

  // Customer - Messaging (auth required)
  static String conversationMessages(String type, int id) => '/customer/my/conversations/$type/$id/messages';
  static String markConversationRead(String type, int id) => '/customer/my/conversations/$type/$id/read';

  // Advertisements
  static const String advertisements = '/storefront/advertisements';
  static String adImpression(int id) => '/advertisements/$id/impression';
  static String adClick(int id) => '/advertisements/$id/click';
}
