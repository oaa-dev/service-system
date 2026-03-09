// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format width=80

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:flutter_secure_storage/flutter_secure_storage.dart' as _i558;
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;
import 'package:mobile/core/network/api_client.dart' as _i456;
import 'package:mobile/core/network/auth_interceptor.dart' as _i819;
import 'package:mobile/core/storage/secure_storage.dart' as _i637;
import 'package:mobile/features/ads/data/datasources/ads_remote_data_source.dart'
    as _i658;
import 'package:mobile/features/auth/data/datasources/auth_local_data_source.dart'
    as _i913;
import 'package:mobile/features/auth/data/datasources/auth_remote_data_source.dart'
    as _i996;
import 'package:mobile/features/auth/data/repositories/auth_repository_impl.dart'
    as _i950;
import 'package:mobile/features/auth/domain/repositories/auth_repository.dart'
    as _i202;
import 'package:mobile/features/auth/domain/usecases/check_auth_status_use_case.dart'
    as _i96;
import 'package:mobile/features/auth/domain/usecases/get_current_user_use_case.dart'
    as _i232;
import 'package:mobile/features/auth/domain/usecases/get_verification_status_use_case.dart'
    as _i293;
import 'package:mobile/features/auth/domain/usecases/login_use_case.dart'
    as _i1007;
import 'package:mobile/features/auth/domain/usecases/logout_use_case.dart'
    as _i254;
import 'package:mobile/features/auth/domain/usecases/register_use_case.dart'
    as _i10;
import 'package:mobile/features/auth/domain/usecases/resend_otp_use_case.dart'
    as _i279;
import 'package:mobile/features/auth/domain/usecases/verify_otp_use_case.dart'
    as _i48;
import 'package:mobile/features/auth/presentation/bloc/auth_bloc.dart' as _i520;
import 'package:mobile/features/auth/presentation/bloc/otp_bloc.dart' as _i576;
import 'package:mobile/features/coupons/data/datasources/coupons_remote_data_source.dart'
    as _i364;
import 'package:mobile/features/coupons/data/repositories/coupons_repository_impl.dart'
    as _i328;
import 'package:mobile/features/coupons/domain/repositories/coupons_repository.dart'
    as _i604;
import 'package:mobile/features/coupons/domain/usecases/claim_coupon_use_case.dart'
    as _i1045;
import 'package:mobile/features/coupons/domain/usecases/get_merchant_coupons_use_case.dart'
    as _i406;
import 'package:mobile/features/coupons/domain/usecases/get_my_coupons_use_case.dart'
    as _i580;
import 'package:mobile/features/coupons/presentation/bloc/coupons_bloc.dart'
    as _i170;
import 'package:mobile/features/dashboard/data/datasources/dashboard_remote_data_source.dart'
    as _i720;
import 'package:mobile/features/dashboard/data/repositories/dashboard_repository_impl.dart'
    as _i788;
import 'package:mobile/features/dashboard/domain/repositories/dashboard_repository.dart'
    as _i657;
import 'package:mobile/features/dashboard/domain/usecases/get_dashboard_stats_use_case.dart'
    as _i166;
import 'package:mobile/features/dashboard/presentation/bloc/dashboard_bloc.dart'
    as _i354;
import 'package:mobile/features/favorites/data/datasources/favorites_remote_data_source.dart'
    as _i636;
import 'package:mobile/features/favorites/data/repositories/favorites_repository_impl.dart'
    as _i333;
import 'package:mobile/features/favorites/domain/repositories/favorites_repository.dart'
    as _i108;
import 'package:mobile/features/favorites/domain/usecases/get_my_favorites_use_case.dart'
    as _i362;
import 'package:mobile/features/favorites/domain/usecases/toggle_favorite_use_case.dart'
    as _i886;
import 'package:mobile/features/favorites/presentation/bloc/favorites_bloc.dart'
    as _i413;
import 'package:mobile/features/loyalty/data/datasources/loyalty_remote_data_source.dart'
    as _i712;
import 'package:mobile/features/loyalty/data/repositories/loyalty_repository_impl.dart'
    as _i128;
import 'package:mobile/features/loyalty/domain/repositories/loyalty_repository.dart'
    as _i360;
import 'package:mobile/features/loyalty/domain/usecases/get_loyalty_card_detail_use_case.dart'
    as _i904;
import 'package:mobile/features/loyalty/domain/usecases/get_my_loyalty_cards_use_case.dart'
    as _i840;
import 'package:mobile/features/loyalty/domain/usecases/get_my_rewards_use_case.dart'
    as _i33;
import 'package:mobile/features/loyalty/domain/usecases/scan_qr_code_use_case.dart'
    as _i872;
import 'package:mobile/features/loyalty/presentation/bloc/loyalty_cards/loyalty_cards_bloc.dart'
    as _i40;
import 'package:mobile/features/loyalty/presentation/bloc/qr_scanner/qr_scanner_bloc.dart'
    as _i746;
import 'package:mobile/features/messaging/data/datasources/messaging_remote_data_source.dart'
    as _i645;
import 'package:mobile/features/messaging/data/repositories/messaging_repository_impl.dart'
    as _i717;
import 'package:mobile/features/messaging/domain/repositories/messaging_repository.dart'
    as _i205;
import 'package:mobile/features/messaging/domain/usecases/get_messages_use_case.dart'
    as _i953;
import 'package:mobile/features/messaging/domain/usecases/mark_conversation_read_use_case.dart'
    as _i402;
import 'package:mobile/features/messaging/domain/usecases/send_message_use_case.dart'
    as _i814;
import 'package:mobile/features/messaging/presentation/bloc/chat/chat_bloc.dart'
    as _i546;
import 'package:mobile/features/profile/data/datasources/profile_remote_data_source.dart'
    as _i1012;
import 'package:mobile/features/profile/data/repositories/profile_repository_impl.dart'
    as _i335;
import 'package:mobile/features/profile/domain/repositories/profile_repository.dart'
    as _i728;
import 'package:mobile/features/profile/domain/usecases/change_password_use_case.dart'
    as _i796;
import 'package:mobile/features/profile/domain/usecases/get_payment_methods_use_case.dart'
    as _i822;
import 'package:mobile/features/profile/domain/usecases/get_profile_use_case.dart'
    as _i671;
import 'package:mobile/features/profile/domain/usecases/update_payment_preference_use_case.dart'
    as _i576;
import 'package:mobile/features/profile/domain/usecases/update_profile_use_case.dart'
    as _i1051;
import 'package:mobile/features/profile/domain/usecases/upload_avatar_use_case.dart'
    as _i1000;
import 'package:mobile/features/profile/presentation/bloc/profile/profile_bloc.dart'
    as _i779;
import 'package:mobile/features/referrals/data/datasources/referrals_remote_data_source.dart'
    as _i814;
import 'package:mobile/features/referrals/data/repositories/referrals_repository_impl.dart'
    as _i926;
import 'package:mobile/features/referrals/domain/repositories/referrals_repository.dart'
    as _i245;
import 'package:mobile/features/referrals/domain/usecases/accept_referral_use_case.dart'
    as _i48;
import 'package:mobile/features/referrals/domain/usecases/generate_referral_code_use_case.dart'
    as _i464;
import 'package:mobile/features/referrals/domain/usecases/get_my_referral_codes_use_case.dart'
    as _i845;
import 'package:mobile/features/referrals/domain/usecases/get_my_referral_rewards_use_case.dart'
    as _i147;
import 'package:mobile/features/referrals/domain/usecases/get_my_referrals_use_case.dart'
    as _i295;
import 'package:mobile/features/referrals/presentation/bloc/referrals_bloc.dart'
    as _i706;
import 'package:mobile/features/reviews/data/datasources/reviews_remote_data_source.dart'
    as _i502;
import 'package:mobile/features/reviews/data/repositories/reviews_repository_impl.dart'
    as _i299;
import 'package:mobile/features/reviews/domain/repositories/reviews_repository.dart'
    as _i1013;
import 'package:mobile/features/reviews/domain/usecases/create_review_use_case.dart'
    as _i1067;
import 'package:mobile/features/reviews/domain/usecases/delete_review_use_case.dart'
    as _i467;
import 'package:mobile/features/reviews/domain/usecases/get_merchant_reviews_use_case.dart'
    as _i869;
import 'package:mobile/features/reviews/domain/usecases/get_my_reviews_use_case.dart'
    as _i58;
import 'package:mobile/features/reviews/domain/usecases/update_review_use_case.dart'
    as _i914;
import 'package:mobile/features/reviews/presentation/bloc/reviews/reviews_bloc.dart'
    as _i558;
import 'package:mobile/features/reviews/presentation/bloc/write_review/write_review_bloc.dart'
    as _i24;
import 'package:mobile/features/storefront/data/datasources/storefront_remote_data_source.dart'
    as _i972;
import 'package:mobile/features/storefront/data/repositories/storefront_repository_impl.dart'
    as _i295;
import 'package:mobile/features/storefront/domain/repositories/storefront_repository.dart'
    as _i400;
import 'package:mobile/features/storefront/domain/usecases/create_booking_use_case.dart'
    as _i753;
import 'package:mobile/features/storefront/domain/usecases/create_order_use_case.dart'
    as _i60;
import 'package:mobile/features/storefront/domain/usecases/create_reservation_use_case.dart'
    as _i896;
import 'package:mobile/features/storefront/domain/usecases/get_booking_availability_use_case.dart'
    as _i97;
import 'package:mobile/features/storefront/domain/usecases/get_merchant_detail_use_case.dart'
    as _i508;
import 'package:mobile/features/storefront/domain/usecases/get_merchant_services_use_case.dart'
    as _i285;
import 'package:mobile/features/storefront/domain/usecases/get_merchants_use_case.dart'
    as _i826;
import 'package:mobile/features/storefront/presentation/bloc/booking_form/booking_form_bloc.dart'
    as _i435;
import 'package:mobile/features/storefront/presentation/bloc/merchant_detail/merchant_detail_bloc.dart'
    as _i629;
import 'package:mobile/features/storefront/presentation/bloc/merchant_list/merchant_list_bloc.dart'
    as _i968;
import 'package:mobile/features/storefront/presentation/bloc/order_form/order_form_bloc.dart'
    as _i508;
import 'package:mobile/features/storefront/presentation/bloc/reservation_form/reservation_form_bloc.dart'
    as _i833;
import 'package:mobile/features/transactions/data/datasources/transactions_remote_data_source.dart'
    as _i273;
import 'package:mobile/features/transactions/data/repositories/transactions_repository_impl.dart'
    as _i615;
import 'package:mobile/features/transactions/domain/repositories/transactions_repository.dart'
    as _i1060;
import 'package:mobile/features/transactions/domain/usecases/cancel_booking_use_case.dart'
    as _i194;
import 'package:mobile/features/transactions/domain/usecases/cancel_order_use_case.dart'
    as _i1004;
import 'package:mobile/features/transactions/domain/usecases/cancel_reservation_use_case.dart'
    as _i944;
import 'package:mobile/features/transactions/domain/usecases/get_booking_detail_use_case.dart'
    as _i444;
import 'package:mobile/features/transactions/domain/usecases/get_my_bookings_use_case.dart'
    as _i997;
import 'package:mobile/features/transactions/domain/usecases/get_my_orders_use_case.dart'
    as _i862;
import 'package:mobile/features/transactions/domain/usecases/get_my_reservations_use_case.dart'
    as _i495;
import 'package:mobile/features/transactions/domain/usecases/get_order_detail_use_case.dart'
    as _i747;
import 'package:mobile/features/transactions/domain/usecases/get_reservation_detail_use_case.dart'
    as _i267;
import 'package:mobile/features/transactions/presentation/bloc/bookings/bookings_bloc.dart'
    as _i722;
import 'package:mobile/features/transactions/presentation/bloc/orders/orders_bloc.dart'
    as _i927;
import 'package:mobile/features/transactions/presentation/bloc/reservations/reservations_bloc.dart'
    as _i588;

extension GetItInjectableX on _i174.GetIt {
  // initializes the registration of main-scope dependencies inside of GetIt
  _i174.GetIt init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) {
    final gh = _i526.GetItHelper(this, environment, environmentFilter);
    gh.lazySingleton<_i637.SecureStorageService>(
      () => _i637.SecureStorageService(gh<_i558.FlutterSecureStorage>()),
    );
    gh.lazySingleton<_i913.AuthLocalDataSource>(
      () => _i913.AuthLocalDataSourceImpl(gh<_i637.SecureStorageService>()),
    );
    gh.lazySingleton<_i819.AuthInterceptor>(
      () => _i819.AuthInterceptor(gh<_i637.SecureStorageService>()),
    );
    gh.lazySingleton<_i456.ApiClient>(
      () => _i456.ApiClient(gh<_i819.AuthInterceptor>()),
    );
    gh.lazySingleton<_i658.AdsRemoteDataSource>(
      () => _i658.AdsRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i972.StorefrontRemoteDataSource>(
      () => _i972.StorefrontRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i814.ReferralsRemoteDataSource>(
      () => _i814.ReferralsRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i245.ReferralsRepository>(
      () =>
          _i926.ReferralsRepositoryImpl(gh<_i814.ReferralsRemoteDataSource>()),
    );
    gh.lazySingleton<_i400.StorefrontRepository>(
      () => _i295.StorefrontRepositoryImpl(
        gh<_i972.StorefrontRemoteDataSource>(),
      ),
    );
    gh.lazySingleton<_i48.AcceptReferralUseCase>(
      () => _i48.AcceptReferralUseCase(gh<_i245.ReferralsRepository>()),
    );
    gh.lazySingleton<_i464.GenerateReferralCodeUseCase>(
      () => _i464.GenerateReferralCodeUseCase(gh<_i245.ReferralsRepository>()),
    );
    gh.lazySingleton<_i845.GetMyReferralCodesUseCase>(
      () => _i845.GetMyReferralCodesUseCase(gh<_i245.ReferralsRepository>()),
    );
    gh.lazySingleton<_i147.GetMyReferralRewardsUseCase>(
      () => _i147.GetMyReferralRewardsUseCase(gh<_i245.ReferralsRepository>()),
    );
    gh.lazySingleton<_i295.GetMyReferralsUseCase>(
      () => _i295.GetMyReferralsUseCase(gh<_i245.ReferralsRepository>()),
    );
    gh.lazySingleton<_i502.ReviewsRemoteDataSource>(
      () => _i502.ReviewsRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i364.CouponsRemoteDataSource>(
      () => _i364.CouponsRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i720.DashboardRemoteDataSource>(
      () => _i720.DashboardRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i273.TransactionsRemoteDataSource>(
      () => _i273.TransactionsRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i996.AuthRemoteDataSource>(
      () => _i996.AuthRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i645.MessagingRemoteDataSource>(
      () => _i645.MessagingRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i202.AuthRepository>(
      () => _i950.AuthRepositoryImpl(
        gh<_i996.AuthRemoteDataSource>(),
        gh<_i913.AuthLocalDataSource>(),
      ),
    );
    gh.lazySingleton<_i712.LoyaltyRemoteDataSource>(
      () => _i712.LoyaltyRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i1012.ProfileRemoteDataSource>(
      () => _i1012.ProfileRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i636.FavoritesRemoteDataSource>(
      () => _i636.FavoritesRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i108.FavoritesRepository>(
      () =>
          _i333.FavoritesRepositoryImpl(gh<_i636.FavoritesRemoteDataSource>()),
    );
    gh.lazySingleton<_i1013.ReviewsRepository>(
      () => _i299.ReviewsRepositoryImpl(gh<_i502.ReviewsRemoteDataSource>()),
    );
    gh.lazySingleton<_i753.CreateBookingUseCase>(
      () => _i753.CreateBookingUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i60.CreateOrderUseCase>(
      () => _i60.CreateOrderUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i896.CreateReservationUseCase>(
      () => _i896.CreateReservationUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i97.GetBookingAvailabilityUseCase>(
      () =>
          _i97.GetBookingAvailabilityUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i508.GetMerchantDetailUseCase>(
      () => _i508.GetMerchantDetailUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i285.GetMerchantServicesUseCase>(
      () => _i285.GetMerchantServicesUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i826.GetMerchantsUseCase>(
      () => _i826.GetMerchantsUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i604.CouponsRepository>(
      () => _i328.CouponsRepositoryImpl(gh<_i364.CouponsRemoteDataSource>()),
    );
    gh.lazySingleton<_i360.LoyaltyRepository>(
      () => _i128.LoyaltyRepositoryImpl(gh<_i712.LoyaltyRemoteDataSource>()),
    );
    gh.lazySingleton<_i1045.ClaimCouponUseCase>(
      () => _i1045.ClaimCouponUseCase(gh<_i604.CouponsRepository>()),
    );
    gh.lazySingleton<_i406.GetMerchantCouponsUseCase>(
      () => _i406.GetMerchantCouponsUseCase(gh<_i604.CouponsRepository>()),
    );
    gh.lazySingleton<_i580.GetMyCouponsUseCase>(
      () => _i580.GetMyCouponsUseCase(gh<_i604.CouponsRepository>()),
    );
    gh.factory<_i629.MerchantDetailBloc>(
      () => _i629.MerchantDetailBloc(
        gh<_i508.GetMerchantDetailUseCase>(),
        gh<_i285.GetMerchantServicesUseCase>(),
      ),
    );
    gh.lazySingleton<_i1060.TransactionsRepository>(
      () => _i615.TransactionsRepositoryImpl(
        gh<_i273.TransactionsRemoteDataSource>(),
      ),
    );
    gh.factory<_i435.BookingFormBloc>(
      () => _i435.BookingFormBloc(
        gh<_i97.GetBookingAvailabilityUseCase>(),
        gh<_i753.CreateBookingUseCase>(),
      ),
    );
    gh.lazySingleton<_i205.MessagingRepository>(
      () =>
          _i717.MessagingRepositoryImpl(gh<_i645.MessagingRemoteDataSource>()),
    );
    gh.factory<_i706.ReferralsBloc>(
      () => _i706.ReferralsBloc(
        gh<_i845.GetMyReferralCodesUseCase>(),
        gh<_i295.GetMyReferralsUseCase>(),
        gh<_i147.GetMyReferralRewardsUseCase>(),
        gh<_i48.AcceptReferralUseCase>(),
      ),
    );
    gh.lazySingleton<_i953.GetMessagesUseCase>(
      () => _i953.GetMessagesUseCase(gh<_i205.MessagingRepository>()),
    );
    gh.lazySingleton<_i402.MarkConversationReadUseCase>(
      () => _i402.MarkConversationReadUseCase(gh<_i205.MessagingRepository>()),
    );
    gh.lazySingleton<_i814.SendMessageUseCase>(
      () => _i814.SendMessageUseCase(gh<_i205.MessagingRepository>()),
    );
    gh.factory<_i833.ReservationFormBloc>(
      () => _i833.ReservationFormBloc(gh<_i896.CreateReservationUseCase>()),
    );
    gh.lazySingleton<_i194.CancelBookingUseCase>(
      () => _i194.CancelBookingUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i1004.CancelOrderUseCase>(
      () => _i1004.CancelOrderUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i944.CancelReservationUseCase>(
      () => _i944.CancelReservationUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i444.GetBookingDetailUseCase>(
      () => _i444.GetBookingDetailUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i997.GetMyBookingsUseCase>(
      () => _i997.GetMyBookingsUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i862.GetMyOrdersUseCase>(
      () => _i862.GetMyOrdersUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i495.GetMyReservationsUseCase>(
      () => _i495.GetMyReservationsUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i747.GetOrderDetailUseCase>(
      () => _i747.GetOrderDetailUseCase(gh<_i1060.TransactionsRepository>()),
    );
    gh.lazySingleton<_i267.GetReservationDetailUseCase>(
      () => _i267.GetReservationDetailUseCase(
        gh<_i1060.TransactionsRepository>(),
      ),
    );
    gh.lazySingleton<_i904.GetLoyaltyCardDetailUseCase>(
      () => _i904.GetLoyaltyCardDetailUseCase(gh<_i360.LoyaltyRepository>()),
    );
    gh.lazySingleton<_i840.GetMyLoyaltyCardsUseCase>(
      () => _i840.GetMyLoyaltyCardsUseCase(gh<_i360.LoyaltyRepository>()),
    );
    gh.lazySingleton<_i33.GetMyRewardsUseCase>(
      () => _i33.GetMyRewardsUseCase(gh<_i360.LoyaltyRepository>()),
    );
    gh.lazySingleton<_i872.ScanQrCodeUseCase>(
      () => _i872.ScanQrCodeUseCase(gh<_i360.LoyaltyRepository>()),
    );
    gh.lazySingleton<_i657.DashboardRepository>(
      () =>
          _i788.DashboardRepositoryImpl(gh<_i720.DashboardRemoteDataSource>()),
    );
    gh.factory<_i588.ReservationsBloc>(
      () => _i588.ReservationsBloc(
        gh<_i495.GetMyReservationsUseCase>(),
        gh<_i944.CancelReservationUseCase>(),
      ),
    );
    gh.factory<_i508.OrderFormBloc>(
      () => _i508.OrderFormBloc(gh<_i60.CreateOrderUseCase>()),
    );
    gh.lazySingleton<_i96.CheckAuthStatusUseCase>(
      () => _i96.CheckAuthStatusUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i232.GetCurrentUserUseCase>(
      () => _i232.GetCurrentUserUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i293.GetVerificationStatusUseCase>(
      () => _i293.GetVerificationStatusUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i1007.LoginUseCase>(
      () => _i1007.LoginUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i254.LogoutUseCase>(
      () => _i254.LogoutUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i10.RegisterUseCase>(
      () => _i10.RegisterUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i279.ResendOtpUseCase>(
      () => _i279.ResendOtpUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i48.VerifyOtpUseCase>(
      () => _i48.VerifyOtpUseCase(gh<_i202.AuthRepository>()),
    );
    gh.lazySingleton<_i728.ProfileRepository>(
      () => _i335.ProfileRepositoryImpl(gh<_i1012.ProfileRemoteDataSource>()),
    );
    gh.lazySingleton<_i1067.CreateReviewUseCase>(
      () => _i1067.CreateReviewUseCase(gh<_i1013.ReviewsRepository>()),
    );
    gh.lazySingleton<_i467.DeleteReviewUseCase>(
      () => _i467.DeleteReviewUseCase(gh<_i1013.ReviewsRepository>()),
    );
    gh.lazySingleton<_i869.GetMerchantReviewsUseCase>(
      () => _i869.GetMerchantReviewsUseCase(gh<_i1013.ReviewsRepository>()),
    );
    gh.lazySingleton<_i58.GetMyReviewsUseCase>(
      () => _i58.GetMyReviewsUseCase(gh<_i1013.ReviewsRepository>()),
    );
    gh.lazySingleton<_i914.UpdateReviewUseCase>(
      () => _i914.UpdateReviewUseCase(gh<_i1013.ReviewsRepository>()),
    );
    gh.factory<_i170.CouponsBloc>(
      () => _i170.CouponsBloc(
        gh<_i580.GetMyCouponsUseCase>(),
        gh<_i1045.ClaimCouponUseCase>(),
      ),
    );
    gh.factory<_i968.MerchantListBloc>(
      () => _i968.MerchantListBloc(
        gh<_i826.GetMerchantsUseCase>(),
        gh<_i972.StorefrontRemoteDataSource>(),
      ),
    );
    gh.lazySingleton<_i362.GetMyFavoritesUseCase>(
      () => _i362.GetMyFavoritesUseCase(gh<_i108.FavoritesRepository>()),
    );
    gh.lazySingleton<_i886.ToggleFavoriteUseCase>(
      () => _i886.ToggleFavoriteUseCase(gh<_i108.FavoritesRepository>()),
    );
    gh.factory<_i520.AuthBloc>(
      () => _i520.AuthBloc(
        gh<_i1007.LoginUseCase>(),
        gh<_i10.RegisterUseCase>(),
        gh<_i254.LogoutUseCase>(),
        gh<_i232.GetCurrentUserUseCase>(),
        gh<_i96.CheckAuthStatusUseCase>(),
      ),
    );
    gh.factory<_i746.QrScannerBloc>(
      () => _i746.QrScannerBloc(gh<_i872.ScanQrCodeUseCase>()),
    );
    gh.factory<_i24.WriteReviewBloc>(
      () => _i24.WriteReviewBloc(
        gh<_i1067.CreateReviewUseCase>(),
        gh<_i914.UpdateReviewUseCase>(),
      ),
    );
    gh.factory<_i558.ReviewsBloc>(
      () => _i558.ReviewsBloc(
        gh<_i869.GetMerchantReviewsUseCase>(),
        gh<_i58.GetMyReviewsUseCase>(),
        gh<_i467.DeleteReviewUseCase>(),
      ),
    );
    gh.factory<_i546.ChatBloc>(
      () => _i546.ChatBloc(
        gh<_i953.GetMessagesUseCase>(),
        gh<_i814.SendMessageUseCase>(),
        gh<_i402.MarkConversationReadUseCase>(),
      ),
    );
    gh.factory<_i413.FavoritesBloc>(
      () => _i413.FavoritesBloc(
        gh<_i362.GetMyFavoritesUseCase>(),
        gh<_i886.ToggleFavoriteUseCase>(),
      ),
    );
    gh.factory<_i927.OrdersBloc>(
      () => _i927.OrdersBloc(
        gh<_i862.GetMyOrdersUseCase>(),
        gh<_i1004.CancelOrderUseCase>(),
      ),
    );
    gh.factory<_i722.BookingsBloc>(
      () => _i722.BookingsBloc(
        gh<_i997.GetMyBookingsUseCase>(),
        gh<_i194.CancelBookingUseCase>(),
      ),
    );
    gh.factory<_i40.LoyaltyCardsBloc>(
      () => _i40.LoyaltyCardsBloc(
        gh<_i840.GetMyLoyaltyCardsUseCase>(),
        gh<_i904.GetLoyaltyCardDetailUseCase>(),
        gh<_i33.GetMyRewardsUseCase>(),
      ),
    );
    gh.lazySingleton<_i166.GetDashboardStatsUseCase>(
      () => _i166.GetDashboardStatsUseCase(gh<_i657.DashboardRepository>()),
    );
    gh.factory<_i576.OtpBloc>(
      () => _i576.OtpBloc(
        gh<_i48.VerifyOtpUseCase>(),
        gh<_i279.ResendOtpUseCase>(),
        gh<_i293.GetVerificationStatusUseCase>(),
      ),
    );
    gh.lazySingleton<_i796.ChangePasswordUseCase>(
      () => _i796.ChangePasswordUseCase(gh<_i728.ProfileRepository>()),
    );
    gh.lazySingleton<_i822.GetPaymentMethodsUseCase>(
      () => _i822.GetPaymentMethodsUseCase(gh<_i728.ProfileRepository>()),
    );
    gh.lazySingleton<_i671.GetProfileUseCase>(
      () => _i671.GetProfileUseCase(gh<_i728.ProfileRepository>()),
    );
    gh.lazySingleton<_i576.UpdatePaymentPreferenceUseCase>(
      () => _i576.UpdatePaymentPreferenceUseCase(gh<_i728.ProfileRepository>()),
    );
    gh.lazySingleton<_i1051.UpdateProfileUseCase>(
      () => _i1051.UpdateProfileUseCase(gh<_i728.ProfileRepository>()),
    );
    gh.lazySingleton<_i1000.UploadAvatarUseCase>(
      () => _i1000.UploadAvatarUseCase(gh<_i728.ProfileRepository>()),
    );
    gh.factory<_i779.ProfileBloc>(
      () => _i779.ProfileBloc(
        gh<_i671.GetProfileUseCase>(),
        gh<_i1051.UpdateProfileUseCase>(),
        gh<_i1000.UploadAvatarUseCase>(),
        gh<_i796.ChangePasswordUseCase>(),
        gh<_i822.GetPaymentMethodsUseCase>(),
        gh<_i576.UpdatePaymentPreferenceUseCase>(),
        gh<_i254.LogoutUseCase>(),
      ),
    );
    gh.factory<_i354.DashboardBloc>(
      () => _i354.DashboardBloc(gh<_i166.GetDashboardStatsUseCase>()),
    );
    return this;
  }
}
