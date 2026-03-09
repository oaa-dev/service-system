import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../data/datasources/ads_remote_data_source.dart';
import '../../data/models/advertisement_model.dart';

class AdBannerCarousel extends StatefulWidget {
  /// Optional position filter (e.g., 'banner', 'sidebar').
  /// If null, all ads are shown.
  final String? position;

  const AdBannerCarousel({super.key, this.position});

  @override
  State<AdBannerCarousel> createState() => _AdBannerCarouselState();
}

class _AdBannerCarouselState extends State<AdBannerCarousel> {
  final _pageController = PageController(viewportFraction: 0.92);
  Timer? _autoScrollTimer;
  int _currentPage = 0;
  List<AdvertisementModel> _ads = [];
  bool _loading = true;
  final Set<int> _trackedImpressions = {};

  @override
  void initState() {
    super.initState();
    _loadAds();
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadAds() async {
    final dataSource = GetIt.instance<AdsRemoteDataSource>();
    final result = await dataSource.getAdvertisements();
    if (!mounted) return;

    result.fold(
      (_) => setState(() => _loading = false),
      (ads) {
        final filtered = widget.position != null
            ? ads.where((a) => a.position == widget.position).toList()
            : ads;
        setState(() {
          _ads = filtered;
          _loading = false;
        });
        if (filtered.length > 1) {
          _startAutoScroll();
        }
        // Track impression for the first visible ad
        if (filtered.isNotEmpty) {
          _trackImpression(filtered[0].id);
        }
      },
    );
  }

  void _trackImpression(int adId) {
    if (_trackedImpressions.contains(adId)) return;
    _trackedImpressions.add(adId);
    final dataSource = GetIt.instance<AdsRemoteDataSource>();
    dataSource.trackImpression(adId);
  }

  void _startAutoScroll() {
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_pageController.hasClients) return;
      final nextPage = (_currentPage + 1) % _ads.length;
      _pageController.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  void _onPageChanged(int index) {
    setState(() => _currentPage = index);
    _trackImpression(_ads[index].id);
  }

  void _onAdTap(AdvertisementModel ad) {
    final dataSource = GetIt.instance<AdsRemoteDataSource>();
    dataSource.trackClick(ad.id);

    if (ad.merchantSlug != null) {
      context.push('/merchants/${ad.merchantSlug}');
    } else if (ad.linkUrl != null) {
      launchUrl(
        Uri.parse(ad.linkUrl!),
        mode: LaunchMode.externalApplication,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _ads.isEmpty) return const SizedBox.shrink();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _pageController,
            itemCount: _ads.length,
            onPageChanged: _onPageChanged,
            itemBuilder: (context, index) {
              final ad = _ads[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: _AdBannerCard(ad: ad, onTap: () => _onAdTap(ad)),
              );
            },
          ),
        ),
        if (_ads.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_ads.length, (index) {
              final isActive = index == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isActive ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primary : AppColors.grey300,
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
        const SizedBox(height: 12),
      ],
    );
  }
}

class _AdBannerCard extends StatelessWidget {
  final AdvertisementModel ad;
  final VoidCallback onTap;

  const _AdBannerCard({required this.ad, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withAlpha(15),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: ad.imageUrl != null
              ? Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: ad.imageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, url) => Container(
                        color: AppColors.primaryLight,
                        child: const Center(
                          child: SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ),
                      errorWidget: (_, e, s) => _buildFallback(),
                    ),
                    // Gradient overlay for text readability
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withAlpha(150),
                            ],
                          ),
                        ),
                        child: Text(
                          ad.title,
                          style: AppTypography.titleSmall.copyWith(
                            color: AppColors.white,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                )
              : _buildFallback(),
        ),
      ),
    );
  }

  Widget _buildFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.warmGradient,
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text(
            ad.title,
            style: AppTypography.titleMedium.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.w700,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (ad.description != null) ...[
            const SizedBox(height: 4),
            Text(
              ad.description!,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.white.withAlpha(200),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }
}
