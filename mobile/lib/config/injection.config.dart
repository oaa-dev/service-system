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
import 'package:mobile/features/storefront/domain/usecases/get_merchant_detail_use_case.dart'
    as _i508;
import 'package:mobile/features/storefront/domain/usecases/get_merchant_services_use_case.dart'
    as _i285;
import 'package:mobile/features/storefront/domain/usecases/get_merchants_use_case.dart'
    as _i826;
import 'package:mobile/features/storefront/presentation/bloc/merchant_detail/merchant_detail_bloc.dart'
    as _i629;
import 'package:mobile/features/storefront/presentation/bloc/merchant_list/merchant_list_bloc.dart'
    as _i968;

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
    gh.lazySingleton<_i972.StorefrontRemoteDataSource>(
      () => _i972.StorefrontRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i400.StorefrontRepository>(
      () => _i295.StorefrontRepositoryImpl(
        gh<_i972.StorefrontRemoteDataSource>(),
      ),
    );
    gh.lazySingleton<_i502.ReviewsRemoteDataSource>(
      () => _i502.ReviewsRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i996.AuthRemoteDataSource>(
      () => _i996.AuthRemoteDataSourceImpl(gh<_i456.ApiClient>()),
    );
    gh.lazySingleton<_i202.AuthRepository>(
      () => _i950.AuthRepositoryImpl(
        gh<_i996.AuthRemoteDataSource>(),
        gh<_i913.AuthLocalDataSource>(),
      ),
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
    gh.lazySingleton<_i508.GetMerchantDetailUseCase>(
      () => _i508.GetMerchantDetailUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i285.GetMerchantServicesUseCase>(
      () => _i285.GetMerchantServicesUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.lazySingleton<_i826.GetMerchantsUseCase>(
      () => _i826.GetMerchantsUseCase(gh<_i400.StorefrontRepository>()),
    );
    gh.factory<_i629.MerchantDetailBloc>(
      () => _i629.MerchantDetailBloc(
        gh<_i508.GetMerchantDetailUseCase>(),
        gh<_i285.GetMerchantServicesUseCase>(),
      ),
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
    gh.factory<_i413.FavoritesBloc>(
      () => _i413.FavoritesBloc(
        gh<_i362.GetMyFavoritesUseCase>(),
        gh<_i886.ToggleFavoriteUseCase>(),
      ),
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
    return this;
  }
}
