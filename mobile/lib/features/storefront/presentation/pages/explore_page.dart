import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../ads/presentation/widgets/ad_banner_carousel.dart';
import '../bloc/merchant_list/merchant_list_bloc.dart';
import '../bloc/merchant_list/merchant_list_event.dart';
import '../bloc/merchant_list/merchant_list_state.dart';
import '../widgets/filter_sheet.dart';
import '../widgets/merchant_card.dart';
import '../widgets/search_bar_widget.dart';

class ExplorePage extends StatefulWidget {
  const ExplorePage({super.key});

  @override
  State<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends State<ExplorePage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    context.read<MerchantListBloc>().add(const LoadMerchantsEvent());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<MerchantListBloc>().add(const LoadMoreMerchantsEvent());
    }
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  String _greetingEmoji() {
    final hour = DateTime.now().hour;
    if (hour < 12) return '\u2600\uFE0F'; // sun
    if (hour < 17) return '\uD83C\uDF1F'; // star2 -- actually let me use simple ones
    return '\uD83C\uDF19'; // crescent moon
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: RefreshIndicator(
        onRefresh: () async => context
            .read<MerchantListBloc>()
            .add(const LoadMerchantsEvent()),
        color: AppColors.primary,
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Top safe area padding
            SliverToBoxAdapter(
              child: SizedBox(
                  height: MediaQuery.of(context).padding.top + 12),
            ),

            // Greeting header with action buttons
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 16, 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_greeting()} ${_greetingEmoji()}',
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.grey500,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Discover',
                            style: AppTypography.headlineLarge.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Find services near you',
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.grey400,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildActionButton(
                      icon: Icons.tune_rounded,
                      onTap: () => FilterSheet.show(context),
                    ),
                    const SizedBox(width: 8),
                    _buildActionButton(
                      icon: Icons.map_rounded,
                      onTap: () {
                        // TODO: toggle map view
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Search bar
            const SliverToBoxAdapter(
              child: SearchBarWidget(),
            ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 16),
            ),

            // Ad banner carousel
            const SliverToBoxAdapter(
              child: AdBannerCarousel(position: 'banner'),
            ),

            // Content area
            BlocBuilder<MerchantListBloc, MerchantListState>(
              builder: (context, state) {
                if (state is MerchantListLoading) {
                  return _buildShimmerList();
                }

                if (state is MerchantListError) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: _buildErrorState(state.message),
                  );
                }

                if (state is MerchantListLoaded) {
                  if (state.merchants.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: _buildEmptyState(),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          if (index == state.merchants.length) {
                            return const Padding(
                              padding: EdgeInsets.all(20),
                              child: Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            );
                          }
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: MerchantCard(
                                merchant: state.merchants[index]),
                          );
                        },
                        childCount: state.merchants.length +
                            (state is MerchantListLoadingMore ? 1 : 0),
                      ),
                    ),
                  );
                }

                return const SliverToBoxAdapter(child: SizedBox.shrink());
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withAlpha(10),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(icon, size: 20, color: AppColors.grey700),
      ),
    );
  }

  Widget _buildShimmerList() {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => const ShimmerCard(),
          childCount: 3,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.storefront_rounded,
                size: 40,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No merchants found',
              style: AppTypography.titleMedium.copyWith(
                color: AppColors.grey700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filters.\nNew merchants are added every day!',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.grey400,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            TextButton.icon(
              onPressed: () => context
                  .read<MerchantListBloc>()
                  .add(const LoadMerchantsEvent()),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Refresh'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                size: 40,
                color: AppColors.error,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Something went wrong',
              style: AppTypography.titleMedium.copyWith(
                color: AppColors.grey700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.grey400,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => context
                  .read<MerchantListBloc>()
                  .add(const LoadMerchantsEvent()),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
