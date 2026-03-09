import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../dashboard/presentation/bloc/dashboard_bloc.dart';
import '../../../dashboard/presentation/bloc/dashboard_event.dart';
import '../../../dashboard/presentation/bloc/dashboard_state.dart';
import '../bloc/profile/profile_bloc.dart';
import '../bloc/profile/profile_event.dart';
import '../bloc/profile/profile_state.dart';
import '../../domain/entities/customer_profile_entity.dart';

class MePage extends StatefulWidget {
  const MePage({super.key});

  @override
  State<MePage> createState() => _MePageState();
}

class _MePageState extends State<MePage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    context.read<ProfileBloc>().add(const LoadProfileEvent());
    context.read<ProfileBloc>().add(const LoadPaymentMethodsEvent());
    context.read<DashboardBloc>().add(const LoadDashboardStatsEvent());
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: BlocBuilder<ProfileBloc, ProfileState>(
        builder: (context, state) {
          if (state is ProfileLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is ProfileLoaded) {
            return _buildContent(context, state.profile);
          }

          if (state is ProfileError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.errorLight,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.error_outline,
                        size: 28, color: AppColors.error),
                  ),
                  const SizedBox(height: 12),
                  Text(state.message, style: AppTypography.bodyMedium),
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: () => context
                        .read<ProfileBloc>()
                        .add(const LoadProfileEvent()),
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return const Center(child: Text('Loading profile...'));
        },
      ),
    );
  }

  Widget _buildContent(BuildContext context, CustomerProfileEntity profile) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildHeader(profile),
          const SizedBox(height: 12),
          _buildStatsRow(),
          const SizedBox(height: 24),
          _buildMenuSection(
            label: 'Account',
            items: [
              _MenuItem(
                icon: Icons.person_outline_rounded,
                iconColor: AppColors.primary,
                iconBgColor: AppColors.primaryLight,
                title: 'Edit Profile',
                subtitle: 'Update your personal information',
                onTap: () => context.push(AppRoutes.editProfile),
              ),
              _MenuItem(
                icon: Icons.payment_rounded,
                iconColor: AppColors.success,
                iconBgColor: AppColors.successLight,
                title: 'Payment Methods',
                subtitle: 'Manage your payment options',
                onTap: () => context.push(AppRoutes.editProfile),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildMenuSection(
            label: 'Activity',
            items: [
              _MenuItem(
                icon: Icons.favorite_rounded,
                iconColor: AppColors.accent,
                iconBgColor: AppColors.accentLight,
                title: 'My Favorites',
                subtitle: 'Merchants you love',
                onTap: () => context.push(AppRoutes.favorites),
              ),
              _MenuItem(
                icon: Icons.star_rounded,
                iconColor: AppColors.gold,
                iconBgColor: AppColors.goldLight,
                title: 'My Reviews',
                subtitle: 'Reviews you have written',
                onTap: () => context.push(AppRoutes.myReviews),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildMenuSection(
            label: 'Settings',
            items: [
              _MenuItem(
                icon: Icons.notifications_outlined,
                iconColor: AppColors.secondary,
                iconBgColor: AppColors.secondaryLight,
                title: 'Notifications',
                subtitle: 'Manage your alerts',
                onTap: () {
                  // TODO: navigate to notifications settings
                },
              ),
              _MenuItem(
                icon: Icons.help_outline_rounded,
                iconColor: AppColors.grey600,
                iconBgColor: AppColors.grey100,
                title: 'Help & Support',
                subtitle: 'FAQs and contact us',
                onTap: () {
                  // TODO: navigate to help
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Logout card
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _buildLogoutCard(),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildHeader(CustomerProfileEntity profile) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withAlpha(25),
            AppColors.secondary.withAlpha(15),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
          child: Column(
            children: [
              // Avatar
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withAlpha(30),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 56,
                  backgroundImage: profile.avatarUrl != null
                      ? NetworkImage(profile.avatarUrl!)
                      : null,
                  backgroundColor: AppColors.grey200,
                  child: profile.avatarUrl == null
                      ? _buildInitialsAvatar(profile)
                      : null,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                profile.name,
                style: AppTypography.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                profile.email,
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.grey500,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInitialsAvatar(CustomerProfileEntity profile) {
    final initials =
        '${profile.firstName.isNotEmpty ? profile.firstName[0] : ''}${profile.lastName.isNotEmpty ? profile.lastName[0] : ''}'
            .toUpperCase();
    return Container(
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: AppTypography.headlineMedium.copyWith(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, dashState) {
        String bookings = '\u2014';
        String reservations = '\u2014';
        String orders = '\u2014';

        if (dashState is DashboardLoaded) {
          bookings = '${dashState.stats.totalBookings}';
          reservations = '${dashState.stats.totalReservations}';
          orders = '${dashState.stats.totalOrders}';
        }

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.grey900.withAlpha(8),
                  blurRadius: 12,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                _buildStatItem(
                  label: 'Bookings',
                  value: bookings,
                  onTap: () => context.push(AppRoutes.transactions),
                ),
                Container(
                  width: 1,
                  height: 32,
                  color: AppColors.grey200,
                ),
                _buildStatItem(
                  label: 'Reservations',
                  value: reservations,
                  onTap: () => context.push(AppRoutes.transactions),
                ),
                Container(
                  width: 1,
                  height: 32,
                  color: AppColors.grey200,
                ),
                _buildStatItem(
                  label: 'Orders',
                  value: orders,
                  onTap: () => context.push(AppRoutes.transactions),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatItem({
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          children: [
            Text(
              value,
              style: AppTypography.titleLarge.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.grey500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuSection({
    required String label,
    required List<_MenuItem> items,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 10),
            child: Text(
              label.toUpperCase(),
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.grey400,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.grey900.withAlpha(6),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                for (int i = 0; i < items.length; i++) ...[
                  _buildMenuTile(items[i]),
                  if (i < items.length - 1)
                    Padding(
                      padding: const EdgeInsets.only(left: 64),
                      child: Divider(
                        height: 1,
                        color: AppColors.grey100,
                      ),
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuTile(_MenuItem item) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: item.onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: item.iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, size: 20, color: item.iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title, style: AppTypography.titleSmall),
                    const SizedBox(height: 2),
                    Text(
                      item.subtitle,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.grey400,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  size: 20, color: AppColors.grey300),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogoutCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.errorLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.error.withAlpha(20),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showLogoutDialog(context),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.error.withAlpha(25),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.logout_rounded,
                      size: 20, color: AppColors.error),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Logout',
                        style: AppTypography.titleSmall.copyWith(
                          color: AppColors.error,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Sign out of your account',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.error.withAlpha(150),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded,
                    size: 20, color: AppColors.error.withAlpha(100)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: TextStyle(color: AppColors.grey500),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<ProfileBloc>().add(const LogoutEvent());
            },
            child: const Text(
              'Logout',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
}
