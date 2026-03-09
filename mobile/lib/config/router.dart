import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import '../core/widgets/main_shell.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/auth/presentation/bloc/auth_state.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/register_page.dart';
import '../features/auth/presentation/pages/otp_verification_page.dart';
import '../features/storefront/presentation/bloc/merchant_list/merchant_list_bloc.dart';
import '../features/storefront/presentation/bloc/merchant_detail/merchant_detail_bloc.dart';
import '../features/storefront/presentation/pages/explore_page.dart';
import '../features/storefront/presentation/pages/merchant_detail_page.dart';
import '../features/favorites/presentation/bloc/favorites_bloc.dart';
import '../features/favorites/presentation/pages/favorites_page.dart';
import '../features/reviews/presentation/bloc/reviews/reviews_bloc.dart';
import '../features/reviews/presentation/pages/my_reviews_page.dart';
import '../features/profile/presentation/bloc/profile/profile_bloc.dart';
import '../features/profile/presentation/pages/me_page.dart';
import '../features/profile/presentation/pages/edit_profile_page.dart';
import '../features/dashboard/presentation/bloc/dashboard_bloc.dart';
import '../features/transactions/presentation/bloc/bookings/bookings_bloc.dart';
import '../features/transactions/presentation/bloc/reservations/reservations_bloc.dart';
import '../features/transactions/presentation/bloc/orders/orders_bloc.dart';
import '../features/transactions/presentation/pages/transactions_page.dart';
import '../features/rewards/presentation/pages/rewards_tab_page.dart';

final GetIt _sl = GetIt.instance;

class AppRoutes {
  AppRoutes._();

  // Auth
  static const String login = '/login';
  static const String register = '/register';
  static const String verifyOtp = '/verify-otp';

  // Shell tabs
  static const String explore = '/explore';
  static const String transactions = '/transactions';
  static const String rewards = '/rewards';
  static const String me = '/me';

  // Storefront sub-routes
  static const String merchantDetail = '/merchants/:slug';
  static String merchantDetailPath(String slug) => '/merchants/$slug';

  // Me sub-routes
  static const String favorites = '/me/favorites';
  static const String myReviews = '/me/reviews';
  static const String editProfile = '/me/profile/edit';
  static const String paymentMethods = '/me/payment-methods';
}

GoRouter createAppRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: AppRoutes.login,
    refreshListenable: _AuthBlocListenable(authBloc),
    redirect: (context, state) {
      final authState = authBloc.state;
      final path = state.uri.path;
      final isOnAuthPage = path == AppRoutes.login || path == AppRoutes.register;
      final isOnOtpPage = path == AppRoutes.verifyOtp;

      if (authState is AuthAuthenticated) {
        if (isOnAuthPage || isOnOtpPage) return AppRoutes.explore;
        return null;
      }
      if (authState is AuthNeedsVerification) {
        if (isOnOtpPage) return null;
        return AppRoutes.verifyOtp;
      }
      if (authState is AuthUnauthenticated || authState is AuthInitial) {
        if (isOnAuthPage) return null;
        return AppRoutes.login;
      }
      return null;
    },
    routes: [
      // Auth routes (outside shell)
      GoRoute(path: AppRoutes.login, builder: (context, state) => const LoginPage()),
      GoRoute(path: AppRoutes.register, builder: (context, state) => const RegisterPage()),
      GoRoute(path: AppRoutes.verifyOtp, builder: (context, state) => const OtpVerificationPage()),

      // Merchant detail (outside shell — full screen)
      GoRoute(
        path: AppRoutes.merchantDetail,
        builder: (context, state) {
          final slug = state.pathParameters['slug']!;
          return BlocProvider(
            create: (_) => _sl<MerchantDetailBloc>(),
            child: MerchantDetailPage(slug: slug),
          );
        },
      ),

      // Shell routes (inside bottom nav)
      ShellRoute(
        builder: (context, state, child) => MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => _sl<FavoritesBloc>()),
            BlocProvider(create: (_) => _sl<ProfileBloc>()),
            BlocProvider(create: (_) => _sl<DashboardBloc>()),
          ],
          child: MainShell(child: child),
        ),
        routes: [
          GoRoute(
            path: AppRoutes.explore,
            builder: (context, state) => BlocProvider(
              create: (_) => _sl<MerchantListBloc>(),
              child: const ExplorePage(),
            ),
          ),
          GoRoute(
            path: AppRoutes.transactions,
            builder: (context, state) => MultiBlocProvider(
              providers: [
                BlocProvider(create: (_) => _sl<BookingsBloc>()),
                BlocProvider(create: (_) => _sl<ReservationsBloc>()),
                BlocProvider(create: (_) => _sl<OrdersBloc>()),
              ],
              child: const TransactionsPage(),
            ),
          ),
          GoRoute(
            path: AppRoutes.rewards,
            builder: (context, state) => const RewardsTabPage(),
          ),
          GoRoute(
            path: AppRoutes.me,
            builder: (context, state) => const MePage(),
          ),
          GoRoute(
            path: AppRoutes.editProfile,
            builder: (context, state) => const EditProfilePage(),
          ),
          GoRoute(
            path: AppRoutes.favorites,
            builder: (context, state) => const FavoritesPage(),
          ),
          GoRoute(
            path: AppRoutes.myReviews,
            builder: (context, state) => BlocProvider(
              create: (_) => _sl<ReviewsBloc>(),
              child: const MyReviewsPage(),
            ),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.uri.path}')),
    ),
  );
}

class _AuthBlocListenable extends ChangeNotifier {
  final AuthBloc _authBloc;
  _AuthBlocListenable(this._authBloc) {
    _authBloc.stream.listen((_) => notifyListeners());
  }
}
