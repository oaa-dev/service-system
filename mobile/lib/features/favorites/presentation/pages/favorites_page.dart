import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/favorites_bloc.dart';
import '../bloc/favorites_event.dart';
import '../bloc/favorites_state.dart';
import '../widgets/favorite_button.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  @override
  void initState() {
    super.initState();
    context.read<FavoritesBloc>().add(const LoadFavoritesEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        surfaceTintColor: AppColors.white,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.favorite_rounded, size: 22, color: AppColors.accent),
            const SizedBox(width: 8),
            Text('My Favorites', style: AppTypography.titleLarge),
          ],
        ),
        centerTitle: true,
      ),
      body: BlocBuilder<FavoritesBloc, FavoritesState>(
        builder: (context, state) {
          if (state is FavoritesLoading) {
            return _buildLoadingGrid();
          }

          if (state is FavoritesError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
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
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    TextButton.icon(
                      onPressed: () => context
                          .read<FavoritesBloc>()
                          .add(const LoadFavoritesEvent()),
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is FavoritesLoaded) {
            if (state.favorites.isEmpty) {
              return _buildEmptyState();
            }
            return _buildGrid(state);
          }

          return const SizedBox();
        },
      ),
    );
  }

  Widget _buildLoadingGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 0.78,
      ),
      itemCount: 6,
      itemBuilder: (context, index) {
        return ShimmerLoading.wrap(
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _PulsingHeart(),
            const SizedBox(height: 24),
            Text(
              'No favorites yet',
              style: AppTypography.headlineSmall.copyWith(
                color: AppColors.grey700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the heart on any merchant to save it here',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.grey400,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrid(FavoritesLoaded state) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 0.78,
      ),
      itemCount: state.favorites.length,
      itemBuilder: (context, index) {
        final merchant = state.favorites[index];
        final isFavorited = state.toggledMerchants[merchant.id] ?? true;

        return _buildMerchantCard(merchant, isFavorited);
      },
    );
  }

  Widget _buildMerchantCard(
    dynamic merchant,
    bool isFavorited,
  ) {
    return GestureDetector(
      onTap: () => context.push('/merchants/${merchant.slug}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withAlpha(8),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image area
                Expanded(
                  flex: 3,
                  child: SizedBox(
                    width: double.infinity,
                    child: merchant.logoUrl != null
                        ? CachedNetworkImage(
                            imageUrl: merchant.logoUrl!,
                            fit: BoxFit.cover,
                            placeholder: (context, url) =>
                                _buildCardGradient(merchant.name),
                            errorWidget: (context, url, error) =>
                                _buildCardGradient(merchant.name),
                          )
                        : _buildCardGradient(merchant.name),
                  ),
                ),
                // Info area
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          merchant.name,
                          style: AppTypography.titleSmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        if (merchant.averageRating != null)
                          _buildRatingBadge(
                            merchant.averageRating!,
                            merchant.reviewCount,
                          ),
                        if (merchant.city != null) ...[
                          const Spacer(),
                          Row(
                            children: [
                              const Icon(Icons.location_on_outlined,
                                  size: 12, color: AppColors.grey400),
                              const SizedBox(width: 2),
                              Expanded(
                                child: Text(
                                  merchant.city!,
                                  style: AppTypography.labelSmall.copyWith(
                                    color: AppColors.grey400,
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
                  ),
                ),
              ],
            ),
            // Favorite heart overlay
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.white.withAlpha(220),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.grey900.withAlpha(15),
                      blurRadius: 6,
                    ),
                  ],
                ),
                child: Center(
                  child: SizedBox(
                    width: 32,
                    height: 32,
                    child: FavoriteButton(
                      merchantId: merchant.id,
                      isFavorited: isFavorited,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardGradient(String name) {
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
          style: AppTypography.displaySmall.copyWith(
            color: AppColors.white.withAlpha(180),
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildRatingBadge(double rating, int? reviewCount) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.goldLight,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, size: 12, color: AppColors.gold),
          const SizedBox(width: 3),
          Text(
            rating.toStringAsFixed(1),
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.grey800,
              fontWeight: FontWeight.w700,
              fontSize: 10,
            ),
          ),
          if (reviewCount != null) ...[
            const SizedBox(width: 2),
            Text(
              '($reviewCount)',
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.grey500,
                fontSize: 10,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// A pulsing heart icon animation for the empty state.
class _PulsingHeart extends StatefulWidget {
  @override
  State<_PulsingHeart> createState() => _PulsingHeartState();
}

class _PulsingHeartState extends State<_PulsingHeart>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _scaleAnimation = Tween<double>(begin: 0.9, end: 1.1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Container(
        width: 88,
        height: 88,
        decoration: BoxDecoration(
          color: AppColors.accentLight,
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Icon(
            Icons.favorite_border_rounded,
            size: 44,
            color: AppColors.accent,
          ),
        ),
      ),
    );
  }
}
