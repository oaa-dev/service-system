import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/merchant_entity.dart';
import '../../domain/entities/service_entity.dart';
import '../bloc/merchant_detail/merchant_detail_bloc.dart';
import '../bloc/merchant_detail/merchant_detail_event.dart';
import '../bloc/merchant_detail/merchant_detail_state.dart';
import '../widgets/business_hours_widget.dart';

class MerchantDetailPage extends StatefulWidget {
  final String slug;

  const MerchantDetailPage({super.key, required this.slug});

  @override
  State<MerchantDetailPage> createState() => _MerchantDetailPageState();
}

class _MerchantDetailPageState extends State<MerchantDetailPage>
    with TickerProviderStateMixin {
  late final ScrollController _scrollController;
  bool _isFavoriteAnimating = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    context
        .read<MerchantDetailBloc>()
        .add(LoadMerchantDetailEvent(widget.slug));
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: BlocBuilder<MerchantDetailBloc, MerchantDetailState>(
        builder: (context, state) {
          if (state is MerchantDetailLoading ||
              state is MerchantDetailInitial) {
            return _buildLoadingState();
          }

          if (state is MerchantDetailError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.errorLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.error_outline,
                          size: 36, color: AppColors.error),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.message,
                      style: AppTypography.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    TextButton.icon(
                      onPressed: () => context
                          .read<MerchantDetailBloc>()
                          .add(LoadMerchantDetailEvent(widget.slug)),
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Try Again'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is MerchantDetailLoaded) {
            return _buildBody(state.merchant, state.services);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          backgroundColor: AppColors.white,
          flexibleSpace: ShimmerLoading.wrap(
            child: Container(color: AppColors.grey200),
          ),
          leading: const SizedBox.shrink(),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerLoading.wrap(
                  child: Container(
                    height: 24,
                    width: 200,
                    decoration: BoxDecoration(
                      color: AppColors.grey200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ShimmerLoading.wrap(
                  child: Container(
                    height: 14,
                    width: 140,
                    decoration: BoxDecoration(
                      color: AppColors.grey200,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const ShimmerCard(),
                const SizedBox(height: 16),
                const ShimmerCard(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBody(MerchantEntity merchant, List<ServiceEntity> services) {
    return Stack(
      children: [
        CustomScrollView(
          controller: _scrollController,
          slivers: [
            _buildSliverAppBar(merchant),
            // Overlapping info card
            SliverToBoxAdapter(
              child: Transform.translate(
                offset: const Offset(0, -24),
                child: _buildInfoCard(merchant),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (merchant.description != null &&
                        merchant.description!.isNotEmpty) ...[
                      Text(merchant.description!,
                          style: AppTypography.bodyMedium),
                      const SizedBox(height: 20),
                    ],
                    _buildCapabilities(merchant),
                    const SizedBox(height: 24),
                    if (merchant.address != null) ...[
                      _buildSectionCard(
                        icon: Icons.location_on_rounded,
                        title: 'Location',
                        child: _buildAddress(merchant.address!),
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (merchant.businessHours != null &&
                        merchant.businessHours!.isNotEmpty) ...[
                      _buildSectionCard(
                        icon: Icons.schedule_rounded,
                        title: 'Business Hours',
                        child: BusinessHoursWidget(
                            businessHours: merchant.businessHours!),
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (services.isNotEmpty) ...[
                      _buildSectionCard(
                        icon: Icons.grid_view_rounded,
                        title: 'Services',
                        trailing: services.length > 3
                            ? GestureDetector(
                                onTap: () {
                                  // TODO: navigate to all services
                                },
                                child: Text(
                                  'See all',
                                  style: AppTypography.labelMedium.copyWith(
                                    color: AppColors.primary,
                                  ),
                                ),
                              )
                            : null,
                        child: _buildServicesHorizontal(services),
                      ),
                      const SizedBox(height: 16),
                    ],
                    // Extra space for the sticky bottom bar
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),
        // Sticky bottom CTA bar
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: _buildStickyCtaBar(merchant),
        ),
      ],
    );
  }

  Widget _buildSliverAppBar(MerchantEntity merchant) {
    return SliverAppBar(
      expandedHeight: 280,
      pinned: true,
      stretch: true,
      backgroundColor: AppColors.white,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        stretchModes: const [
          StretchMode.zoomBackground,
          StretchMode.blurBackground,
        ],
        background: merchant.logoUrl != null
            ? CachedNetworkImage(
                imageUrl: merchant.logoUrl!,
                fit: BoxFit.cover,
                placeholder: (context, url) =>
                    _buildHeroGradient(merchant.name),
                errorWidget: (context, url, error) =>
                    _buildHeroGradient(merchant.name),
              )
            : _buildHeroGradient(merchant.name),
      ),
      leading: Padding(
        padding: const EdgeInsets.all(8),
        child: _buildFrostedButton(
          child: const Icon(Icons.arrow_back_rounded,
              color: AppColors.white, size: 20),
          onTap: () => Navigator.pop(context),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: _buildFrostedButton(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, animation) {
                return ScaleTransition(scale: animation, child: child);
              },
              child: Icon(
                merchant.isFavorited == true
                    ? Icons.favorite_rounded
                    : Icons.favorite_border_rounded,
                key: ValueKey(merchant.isFavorited),
                color: merchant.isFavorited == true
                    ? AppColors.accent
                    : AppColors.white,
                size: 20,
              ),
            ),
            onTap: () {
              if (!_isFavoriteAnimating) {
                setState(() => _isFavoriteAnimating = true);
                // TODO: dispatch favorite toggle event
                Future.delayed(const Duration(milliseconds: 300), () {
                  if (mounted) {
                    setState(() => _isFavoriteAnimating = false);
                  }
                });
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFrostedButton(
      {required Widget child, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.grey900.withAlpha(60),
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.white.withAlpha(40),
                width: 0.5,
              ),
            ),
            child: Center(child: child),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroGradient(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initial,
          style: AppTypography.displayLarge.copyWith(
            color: AppColors.white.withAlpha(180),
            fontSize: 80,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(MerchantEntity merchant) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withAlpha(15),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            merchant.name,
            style: AppTypography.headlineSmall.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          if (merchant.averageRating != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                ...List.generate(5, (index) {
                  final starValue = index + 1;
                  final rating = merchant.averageRating!;
                  if (rating >= starValue) {
                    return const Icon(Icons.star_rounded,
                        size: 18, color: AppColors.gold);
                  } else if (rating >= starValue - 0.5) {
                    return const Icon(Icons.star_half_rounded,
                        size: 18, color: AppColors.gold);
                  } else {
                    return const Icon(Icons.star_rounded,
                        size: 18, color: AppColors.grey200);
                  }
                }),
                const SizedBox(width: 8),
                Text(
                  merchant.averageRating!.toStringAsFixed(1),
                  style: AppTypography.titleSmall.copyWith(
                    color: AppColors.grey800,
                  ),
                ),
                if (merchant.reviewCount != null) ...[
                  const SizedBox(width: 4),
                  Text(
                    '(${merchant.reviewCount} reviews)',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ],
            ),
          ],
          if (merchant.address != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 16, color: AppColors.grey400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    _formatShortAddress(merchant.address!),
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.grey500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatShortAddress(MerchantAddress address) {
    final parts = <String>[];
    if (address.city != null) parts.add(address.city!);
    if (address.province != null) parts.add(address.province!);
    return parts.join(', ');
  }

  Widget _buildCapabilities(MerchantEntity merchant) {
    final capabilities = <_CapabilityData>[];
    if (merchant.canTakeBookings) {
      capabilities.add(_CapabilityData(
        icon: Icons.calendar_today_rounded,
        label: 'Bookings',
        color: AppColors.primary,
        bgColor: AppColors.primaryLight,
      ));
    }
    if (merchant.canSellProducts) {
      capabilities.add(_CapabilityData(
        icon: Icons.shopping_bag_rounded,
        label: 'Orders',
        color: AppColors.success,
        bgColor: AppColors.successLight,
      ));
    }
    if (merchant.canRentUnits) {
      capabilities.add(_CapabilityData(
        icon: Icons.house_rounded,
        label: 'Rentals',
        color: AppColors.secondary,
        bgColor: AppColors.secondaryLight,
      ));
    }

    if (capabilities.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: capabilities.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final cap = capabilities[index];
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: cap.bgColor,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: cap.color.withAlpha(40),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(cap.icon, size: 16, color: cap.color),
                const SizedBox(width: 8),
                Text(
                  cap.label,
                  style: AppTypography.labelMedium.copyWith(
                    color: cap.color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required Widget child,
    Widget? trailing,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withAlpha(8),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Accent top border
          Container(
            height: 2,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child:
                          Icon(icon, size: 16, color: AppColors.primary),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(title, style: AppTypography.titleSmall),
                    ),
                    ?trailing,
                  ],
                ),
                const SizedBox(height: 14),
                child,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddress(MerchantAddress address) {
    final parts = <String>[];
    if (address.street != null) parts.add(address.street!);
    if (address.barangay != null) parts.add(address.barangay!);
    if (address.city != null) parts.add(address.city!);
    if (address.province != null) parts.add(address.province!);
    if (address.region != null) parts.add(address.region!);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            parts.join(', '),
            style: AppTypography.bodyMedium,
          ),
        ),
      ],
    );
  }

  Widget _buildServicesHorizontal(List<ServiceEntity> services) {
    return SizedBox(
      height: 190,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: services.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          return _buildServiceCard(services[index]);
        },
      ),
    );
  }

  Widget _buildServiceCard(ServiceEntity service) {
    return Container(
      width: 160,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withAlpha(6),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Service image
          ClipRRect(
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(12)),
            child: SizedBox(
              height: 100,
              width: 160,
              child: service.imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: service.imageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (context, url) =>
                          _serviceCardPlaceholder(),
                      errorWidget: (context, url, error) =>
                          _serviceCardPlaceholder(),
                    )
                  : _serviceCardPlaceholder(),
            ),
          ),
          // Service info
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.name,
                  style: AppTypography.titleSmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '\u20B1${service.price}',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _serviceCardPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primaryLight, AppColors.secondaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.spa_outlined, color: AppColors.grey300, size: 28),
      ),
    );
  }

  Widget _buildStickyCtaBar(MerchantEntity merchant) {
    final hasBookings = merchant.canTakeBookings;
    final hasOrders = merchant.canSellProducts;
    final isOrg = merchant.isOrganization;

    if (!hasBookings && !hasOrders && !isOrg) return const SizedBox.shrink();

    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 16, 20, MediaQuery.of(context).padding.bottom + 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary,
            AppColors.primaryDark,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withAlpha(60),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: isOrg
            ? _buildOrgCta()
            : _buildIndividualCta(hasBookings, hasOrders),
      ),
    );
  }

  Widget _buildOrgCta() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: () {
          // TODO: navigate to branches list
        },
        icon: const Icon(Icons.store_rounded, size: 20),
        label: const Text('View Branches'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          textStyle: AppTypography.labelLarge.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildIndividualCta(bool hasBookings, bool hasOrders) {
    if (hasBookings && hasOrders) {
      return Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () {
                  // TODO: navigate to booking flow
                },
                icon: const Icon(Icons.calendar_today_rounded, size: 18),
                label: const Text('Book Now'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.white,
                  foregroundColor: AppColors.primary,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                  textStyle: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: SizedBox(
              height: 50,
              child: OutlinedButton.icon(
                onPressed: () {
                  // TODO: navigate to order flow
                },
                icon: const Icon(Icons.shopping_bag_rounded, size: 18),
                label: const Text('Order'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.white,
                  side: const BorderSide(color: AppColors.white, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                  textStyle: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    }

    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: () {
          // TODO: navigate to booking or order flow
        },
        icon: Icon(
          hasBookings
              ? Icons.calendar_today_rounded
              : Icons.shopping_bag_rounded,
          size: 18,
        ),
        label: Text(hasBookings ? 'Book Now' : 'Place Order'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.white,
          foregroundColor: AppColors.primary,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          textStyle: AppTypography.labelLarge.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _CapabilityData {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;

  const _CapabilityData({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
  });
}
