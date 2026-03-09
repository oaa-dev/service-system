import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/loyalty_card_entity.dart';
import '../bloc/loyalty_cards/loyalty_cards_bloc.dart';
import '../bloc/loyalty_cards/loyalty_cards_event.dart';
import '../bloc/loyalty_cards/loyalty_cards_state.dart';
import '../bloc/qr_scanner/qr_scanner_bloc.dart';
import '../bloc/qr_scanner/qr_scanner_event.dart';
import '../bloc/qr_scanner/qr_scanner_state.dart';
import '../widgets/loyalty_card_widget.dart';
import '../widgets/reward_card.dart';
import '../widgets/stamp_grid.dart';
import '../widgets/scan_result_dialog.dart';

class LoyaltyPage extends StatelessWidget {
  const LoyaltyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          toolbarHeight: 0,
          backgroundColor: AppColors.white,
          elevation: 0,
          bottom: TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.grey400,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            labelStyle: AppTypography.labelMedium,
            unselectedLabelStyle: AppTypography.labelMedium,
            tabs: const [
              Tab(text: 'My Cards'),
              Tab(text: 'Rewards'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _CardsTab(),
            _RewardsTab(),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showQrScannerSheet(context),
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          icon: const Icon(Icons.qr_code_scanner_rounded),
          label: const Text('Scan QR'),
        ),
      ),
    );
  }

  void _showQrScannerSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: context.read<QrScannerBloc>(),
        child: const _QrScannerSheet(),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Cards Tab
// ---------------------------------------------------------------------------

class _CardsTab extends StatefulWidget {
  const _CardsTab();

  @override
  State<_CardsTab> createState() => _CardsTabState();
}

class _CardsTabState extends State<_CardsTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    context.read<LoyaltyCardsBloc>().add(const LoadLoyaltyCardsEvent());
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocBuilder<LoyaltyCardsBloc, LoyaltyCardsState>(
      builder: (context, state) {
        return switch (state) {
          LoyaltyCardsInitial() || LoyaltyCardsLoading() =>
            _buildShimmerList(),
          LoyaltyCardsError s => _buildError(s.message, () {
              context
                  .read<LoyaltyCardsBloc>()
                  .add(const LoadLoyaltyCardsEvent());
            }),
          LoyaltyCardsLoaded s => s.cards.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () async {
                    context
                        .read<LoyaltyCardsBloc>()
                        .add(const RefreshLoyaltyCardsEvent());
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: s.cards.length,
                    itemBuilder: (context, index) {
                      final card = s.cards[index];
                      return LoyaltyCardWidget(
                        card: card,
                        onTap: () => _showCardDetail(context, card),
                      );
                    },
                  ),
                ),
        };
      },
    );
  }

  void _showCardDetail(BuildContext context, LoyaltyCardEntity card) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (_, controller) => _CardDetailSheet(card: card),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Rewards Tab
// ---------------------------------------------------------------------------

class _RewardsTab extends StatefulWidget {
  const _RewardsTab();

  @override
  State<_RewardsTab> createState() => _RewardsTabState();
}

class _RewardsTabState extends State<_RewardsTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    context.read<LoyaltyCardsBloc>().add(const LoadMyRewardsEvent());
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocBuilder<LoyaltyCardsBloc, LoyaltyCardsState>(
      builder: (context, state) {
        if (state is! LoyaltyCardsLoaded || state.rewards == null) {
          if (state is LoyaltyCardsError) {
            return _buildError(state.message, () {
              context
                  .read<LoyaltyCardsBloc>()
                  .add(const LoadMyRewardsEvent());
            });
          }
          return _buildShimmerList();
        }

        final rewards = state.rewards!;
        if (rewards.isEmpty) {
          return _buildRewardsEmptyState();
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            context
                .read<LoyaltyCardsBloc>()
                .add(const LoadMyRewardsEvent());
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: rewards.length,
            itemBuilder: (context, index) {
              return RewardCard(reward: rewards[index]);
            },
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Card Detail Bottom Sheet
// ---------------------------------------------------------------------------

class _CardDetailSheet extends StatelessWidget {
  final LoyaltyCardEntity card;

  const _CardDetailSheet({required this.card});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Header
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: card.merchantLogo != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            card.merchantLogo!,
                            fit: BoxFit.cover,
                            width: 48,
                            height: 48,
                            errorBuilder: (_, _, _) => const Icon(
                              Icons.loyalty_rounded,
                              color: AppColors.primary,
                              size: 24,
                            ),
                          ),
                        )
                      : const Icon(
                          Icons.loyalty_rounded,
                          color: AppColors.primary,
                          size: 24,
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(card.programName, style: AppTypography.titleMedium),
                      if (card.merchantName != null)
                        Text(
                          card.merchantName!,
                          style: AppTypography.bodySmall,
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Stamp grid
            Text('Stamp Progress', style: AppTypography.titleSmall),
            const SizedBox(height: 12),
            StampGrid(
              current: card.currentStamps,
              total: card.requiredStamps,
            ),
            const SizedBox(height: 24),
            // Stats
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _StatItem(
                      label: 'Total Stamps',
                      value: '${card.totalStampsEarned}',
                      icon: Icons.star_rounded,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 40,
                    color: AppColors.grey200,
                  ),
                  Expanded(
                    child: _StatItem(
                      label: 'Rewards Earned',
                      value: '${card.totalRewardsEarned}',
                      icon: Icons.card_giftcard_rounded,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Close button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.grey600,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: const BorderSide(color: AppColors.grey300),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(height: 4),
        Text(value, style: AppTypography.titleMedium),
        Text(
          label,
          style: AppTypography.bodySmall,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// QR Scanner Bottom Sheet (text input placeholder)
// ---------------------------------------------------------------------------

class _QrScannerSheet extends StatefulWidget {
  const _QrScannerSheet();

  @override
  State<_QrScannerSheet> createState() => _QrScannerSheetState();
}

class _QrScannerSheetState extends State<_QrScannerSheet> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<QrScannerBloc, QrScannerState>(
      listener: (context, state) {
        if (state is QrScannerSuccess) {
          Navigator.pop(context);
          showDialog(
            context: context,
            builder: (_) => ScanResultDialog(result: state.result),
          );
          // Refresh cards after successful scan
          context
              .read<LoyaltyCardsBloc>()
              .add(const RefreshLoyaltyCardsEvent());
          context.read<QrScannerBloc>().add(const ResetScannerEvent());
        } else if (state is QrScannerError) {
          Navigator.pop(context);
          showDialog(
            context: context,
            builder: (_) => Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: const BoxDecoration(
                        color: AppColors.errorLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.cancel_rounded,
                        color: AppColors.error,
                        size: 40,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text('Scan Failed', style: AppTypography.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      state.message,
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.grey500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('OK'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
          context.read<QrScannerBloc>().add(const ResetScannerEvent());
        }
      },
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.grey300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            // Title
            const Icon(
              Icons.qr_code_scanner_rounded,
              color: AppColors.primary,
              size: 48,
            ),
            const SizedBox(height: 12),
            Text('Scan QR Code', style: AppTypography.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'Enter or paste the QR code from the merchant',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.grey500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            // Text input
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: 'Paste QR code here...',
                hintStyle: AppTypography.bodyMedium.copyWith(
                  color: AppColors.grey400,
                ),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.grey200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.grey200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 2),
                ),
                prefixIcon: const Icon(
                  Icons.qr_code_rounded,
                  color: AppColors.grey400,
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Submit button
            BlocBuilder<QrScannerBloc, QrScannerState>(
              builder: (context, state) {
                final isScanning = state is QrScannerScanning;
                return SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isScanning
                        ? null
                        : () {
                            final token = _controller.text.trim();
                            if (token.isEmpty) return;
                            context
                                .read<QrScannerBloc>()
                                .add(ScanQrEvent(token));
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: AppColors.white,
                      disabledBackgroundColor: AppColors.grey300,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: isScanning
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.white,
                            ),
                          )
                        : const Text('Submit'),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

Widget _buildShimmerList() {
  return ListView.builder(
    padding: const EdgeInsets.all(16),
    itemCount: 3,
    itemBuilder: (_, _) => Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: ShimmerLoading.wrap(
        child: Container(
          height: 140,
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
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
            decoration: const BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.loyalty_rounded,
              size: 40,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No loyalty cards yet',
            style: AppTypography.headlineSmall.copyWith(
              color: AppColors.grey700,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Visit a merchant to get your first loyalty card',
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

Widget _buildRewardsEmptyState() {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              color: AppColors.goldLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.card_giftcard_rounded,
              size: 40,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No rewards yet',
            style: AppTypography.headlineSmall.copyWith(
              color: AppColors.grey700,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Collect stamps to earn rewards from your favorite merchants',
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

Widget _buildError(String message, VoidCallback onRetry) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline_rounded,
              size: 48, color: AppColors.error),
          const SizedBox(height: 16),
          Text(
            message,
            style: AppTypography.bodyMedium.copyWith(color: AppColors.grey700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    ),
  );
}
