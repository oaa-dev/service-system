import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/merchant_entity.dart';
import '../../domain/entities/service_entity.dart';
import '../bloc/booking_form/booking_form_bloc.dart';
import '../bloc/booking_form/booking_form_event.dart';
import '../bloc/merchant_detail/merchant_detail_bloc.dart';
import '../bloc/merchant_detail/merchant_detail_event.dart';
import '../bloc/merchant_detail/merchant_detail_state.dart';
import '../bloc/order_form/order_form_bloc.dart';
import '../bloc/order_form/order_form_event.dart';
import '../bloc/reservation_form/reservation_form_bloc.dart';
import '../bloc/reservation_form/reservation_form_event.dart';
import '../widgets/booking/booking_wizard_sheet.dart';
import '../widgets/business_hours_widget.dart';
import '../widgets/order/order_wizard_sheet.dart';
import '../widgets/reservation/reservation_wizard_sheet.dart';

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
                        title: 'Services (${services.length})',
                        child: _buildServicesGrid(merchant.slug, services),
                      ),
                      const SizedBox(height: 16),
                    ],
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
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

  Widget _buildServicesGrid(String merchantSlug, List<ServiceEntity> services) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.62,
      ),
      itemCount: services.length,
      itemBuilder: (context, index) {
        return _buildServiceCard(merchantSlug, services[index], services);
      },
    );
  }

  Widget _buildServiceCard(String merchantSlug, ServiceEntity service, List<ServiceEntity> allServices) {
    final actionData = _getServiceAction(service);

    return Container(
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
          ClipRRect(
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(12)),
            child: AspectRatio(
              aspectRatio: 1.3,
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
          Expanded(
            child: Padding(
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
                  const Spacer(),
                  if (actionData != null)
                    SizedBox(
                      width: double.infinity,
                      height: 34,
                      child: ElevatedButton.icon(
                        onPressed: () => _onServiceAction(merchantSlug, service, allServices),
                        icon: Icon(actionData.icon, size: 14),
                        label: Text(actionData.label),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: actionData.color,
                          foregroundColor: AppColors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          textStyle: AppTypography.labelSmall.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  _ServiceAction? _getServiceAction(ServiceEntity service) {
    if (service.isBookable) {
      return _ServiceAction(
        icon: Icons.calendar_today_rounded,
        label: 'Book Now',
        color: AppColors.primary,
      );
    }
    if (service.isReservable) {
      return _ServiceAction(
        icon: Icons.house_rounded,
        label: 'Reserve',
        color: AppColors.secondary,
      );
    }
    if (service.isSellable) {
      return _ServiceAction(
        icon: Icons.shopping_bag_rounded,
        label: 'Order',
        color: AppColors.success,
      );
    }
    return null;
  }

  void _onServiceAction(String merchantSlug, ServiceEntity service, List<ServiceEntity> allServices) {
    debugPrint('[ServiceAction] service=${service.name}, isBookable=${service.isBookable}, isReservable=${service.isReservable}, isSellable=${service.isSellable}');
    try {
      if (service.isBookable) {
        _openBookingWizard(merchantSlug, allServices, preselectedService: service);
      } else if (service.isReservable) {
        _openReservationWizard(merchantSlug, allServices, preselectedService: service);
      } else if (service.isSellable) {
        _openOrderWizard(merchantSlug, allServices, preselectedService: service);
      } else {
        debugPrint('[ServiceAction] No matching action for service type');
      }
    } catch (e, stack) {
      debugPrint('[ServiceAction] ERROR: $e\n$stack');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
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

  void _openBookingWizard(String slug, List<ServiceEntity> services, {ServiceEntity? preselectedService}) {
    final sl = GetIt.instance;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.92,
        child: BlocProvider(
          create: (_) => sl<BookingFormBloc>()
            ..add(InitBookingFormEvent(
              services: services,
              merchantSlug: slug,
              preselectedServiceId: preselectedService?.id,
            )),
          child: BookingWizardSheet(
            services: services,
            merchantSlug: slug,
          ),
        ),
      ),
    );
  }

  void _openReservationWizard(String slug, List<ServiceEntity> services, {ServiceEntity? preselectedService}) {
    final sl = GetIt.instance;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.92,
        child: BlocProvider(
          create: (_) => sl<ReservationFormBloc>()
            ..add(InitReservationFormEvent(
              services: services,
              merchantSlug: slug,
              preselectedServiceId: preselectedService?.id,
            )),
          child: ReservationWizardSheet(
            services: services,
            merchantSlug: slug,
          ),
        ),
      ),
    );
  }

  void _openOrderWizard(String slug, List<ServiceEntity> services, {ServiceEntity? preselectedService}) {
    final sl = GetIt.instance;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.92,
        child: BlocProvider(
          create: (_) => sl<OrderFormBloc>()
            ..add(InitOrderFormEvent(
              services: services,
              merchantSlug: slug,
              preselectedServiceId: preselectedService?.id,
            )),
          child: OrderWizardSheet(
            services: services,
            merchantSlug: slug,
          ),
        ),
      ),
    );
  }
}

class _ServiceAction {
  final IconData icon;
  final String label;
  final Color color;

  const _ServiceAction({
    required this.icon,
    required this.label,
    required this.color,
  });
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
