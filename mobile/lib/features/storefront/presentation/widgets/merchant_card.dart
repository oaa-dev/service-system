import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/merchant_entity.dart';

class MerchantCard extends StatefulWidget {
  final MerchantEntity merchant;

  const MerchantCard({super.key, required this.merchant});

  @override
  State<MerchantCard> createState() => _MerchantCardState();
}

class _MerchantCardState extends State<MerchantCard>
    with SingleTickerProviderStateMixin {
  bool _isPressed = false;
  bool _isFavAnimating = false;

  MerchantEntity get merchant => widget.merchant;

  void _onTapDown(TapDownDetails _) {
    setState(() => _isPressed = true);
  }

  void _onTapUp(TapUpDetails _) {
    setState(() => _isPressed = false);
  }

  void _onTapCancel() {
    setState(() => _isPressed = false);
  }

  void _onTap() {
    context.push(AppRoutes.merchantDetailPath(merchant.slug));
  }

  void _onFavoriteTap() {
    setState(() => _isFavAnimating = true);
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) setState(() => _isFavAnimating = false);
    });
    // TODO: dispatch favorite toggle event
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _isPressed ? 0.97 : 1.0,
      duration: const Duration(milliseconds: 150),
      curve: Curves.easeInOut,
      child: GestureDetector(
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        onTap: _onTap,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppColors.grey900.withAlpha(15),
                blurRadius: 20,
                offset: const Offset(0, 4),
                spreadRadius: 0,
              ),
              BoxShadow(
                color: AppColors.grey900.withAlpha(8),
                blurRadius: 6,
                offset: const Offset(0, 2),
                spreadRadius: 0,
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildImageSection(),
              _buildInfoSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageSection() {
    return SizedBox(
      height: 200,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Image or gradient placeholder
          merchant.logoUrl != null
              ? CachedNetworkImage(
                  imageUrl: merchant.logoUrl!,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => _imagePlaceholder(),
                  errorWidget: (context, url, error) => _imagePlaceholder(),
                )
              : _imagePlaceholder(),

          // Bottom gradient overlay for text
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    AppColors.grey900.withAlpha(180),
                  ],
                ),
              ),
            ),
          ),

          // Name and location overlay
          Positioned(
            bottom: 12,
            left: 14,
            right: 70,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  merchant.name,
                  style: AppTypography.titleMedium.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (merchant.address?.city != null ||
                    merchant.address?.province != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_rounded,
                            size: 12, color: Colors.white70),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            _formatLocation(),
                            style: AppTypography.bodySmall.copyWith(
                              color: Colors.white70,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // Rating badge — top right
          if (merchant.averageRating != null)
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.goldLight,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gold.withAlpha(60),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded,
                        size: 14, color: AppColors.gold),
                    const SizedBox(width: 3),
                    Text(
                      merchant.averageRating!.toStringAsFixed(1),
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.grey800,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (merchant.reviewCount != null &&
                        merchant.reviewCount! > 0) ...[
                      const SizedBox(width: 2),
                      Text(
                        '(${merchant.reviewCount})',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.grey500,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

          // Favorite button — top left
          Positioned(
            top: 12,
            left: 12,
            child: GestureDetector(
              onTap: _onFavoriteTap,
              child: AnimatedScale(
                scale: _isFavAnimating ? 1.3 : 1.0,
                duration: const Duration(milliseconds: 200),
                curve: Curves.elasticOut,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.white.withAlpha(230),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.grey900.withAlpha(30),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    merchant.isFavorited == true
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    size: 18,
                    color: merchant.isFavorited == true
                        ? AppColors.accent
                        : AppColors.grey500,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryLight,
            AppColors.surfaceVariant,
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.storefront_rounded,
          size: 48,
          color: AppColors.primary.withAlpha(80),
        ),
      ),
    );
  }

  String _formatLocation() {
    final parts = <String>[];
    if (merchant.address?.city != null) parts.add(merchant.address!.city!);
    if (merchant.address?.province != null) {
      parts.add(merchant.address!.province!);
    }
    return parts.join(', ');
  }

  Widget _buildInfoSection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Row(
        children: [
          Expanded(child: _buildCapabilityChips()),
          if (merchant.distance != null) ...[
            const SizedBox(width: 8),
            _buildDistanceChip(),
          ],
        ],
      ),
    );
  }

  Widget _buildCapabilityChips() {
    final chips = <Widget>[];
    if (merchant.canTakeBookings) {
      chips.add(_capabilityChip('Book', AppColors.primary, Icons.calendar_today_rounded));
    }
    if (merchant.canSellProducts) {
      chips.add(_capabilityChip('Order', AppColors.success, Icons.shopping_bag_rounded));
    }
    if (merchant.canRentUnits) {
      chips.add(_capabilityChip('Rent', AppColors.secondary, Icons.key_rounded));
    }
    if (chips.isEmpty) return const SizedBox.shrink();
    return Wrap(spacing: 6, runSpacing: 6, children: chips);
  }

  Widget _capabilityChip(String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDistanceChip() {
    final km = merchant.distance!;
    final label = km < 1
        ? '${(km * 1000).round()} m'
        : '${km.toStringAsFixed(1)} km';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.grey100,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.near_me_rounded, size: 11, color: AppColors.grey500),
          const SizedBox(width: 3),
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.grey600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
