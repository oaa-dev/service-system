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
}
