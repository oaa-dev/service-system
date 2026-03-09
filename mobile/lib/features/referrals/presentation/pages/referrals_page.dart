import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/referral_entity.dart';
import '../../domain/entities/referral_reward_entity.dart';
import '../bloc/referrals_bloc.dart';
import '../bloc/referrals_event.dart';
import '../bloc/referrals_state.dart';
import '../widgets/referral_code_card.dart';

class ReferralsPage extends StatefulWidget {
  const ReferralsPage({super.key});

  @override
  State<ReferralsPage> createState() => _ReferralsPageState();
}

class _ReferralsPageState extends State<ReferralsPage> {
  final _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<ReferralsBloc>().add(const LoadAllReferralDataEvent());
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ReferralsBloc, ReferralsState>(
        listener: (context, state) {
          if (state is ReferralAcceptSuccess) {
            _codeController.clear();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.success,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            );
          }
          if (state is ReferralsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            );
          }
        },
        builder: (context, state) {
          return switch (state) {
            ReferralsInitial() || ReferralsLoading() => _buildShimmer(),
            ReferralsError _ => _buildContent([], [], []),
            ReferralAccepting() => _buildAccepting(),
            ReferralAcceptSuccess _ => _buildShimmer(),
            ReferralsLoaded s =>
              _buildContent(s.codes, s.referrals, s.rewards),
          };
        },
    );
  }

  Widget _buildContent(
    List<dynamic> codes,
    List<dynamic> referrals,
    List<dynamic> rewards,
  ) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        context.read<ReferralsBloc>().add(const RefreshReferralsEvent());
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Accept referral section
          _buildAcceptReferralSection(),
          const SizedBox(height: 24),

          // My Referral Codes section
          _buildSectionHeader(
              'My Referral Codes', Icons.qr_code_rounded, codes.length),
          const SizedBox(height: 8),
          if (codes.isEmpty)
            _buildEmptySection(
              'No referral codes yet',
              'Generate a referral code from a merchant page',
            )
          else
            ...codes.map((code) => ReferralCodeCard(referralCode: code)),
          const SizedBox(height: 24),

          // My Referrals section
          _buildSectionHeader(
              'My Referrals', Icons.people_rounded, referrals.length),
          const SizedBox(height: 8),
          if (referrals.isEmpty)
            _buildEmptySection(
              'No referrals yet',
              'Share your referral codes with friends',
            )
          else
            ...referrals.map((r) => _buildReferralCard(r as ReferralEntity)),
          const SizedBox(height: 24),

          // Rewards section
          _buildSectionHeader(
              'My Rewards', Icons.card_giftcard_rounded, rewards.length),
          const SizedBox(height: 8),
          if (rewards.isEmpty)
            _buildEmptySection(
              'No rewards yet',
              'Earn rewards by referring friends',
            )
          else
            ...rewards
                .map((r) => _buildRewardCard(r as ReferralRewardEntity)),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildAcceptReferralSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Have a referral code?',
            style: AppTypography.titleMedium.copyWith(
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Enter it below to get your reward',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.white.withAlpha(200),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _codeController,
                  decoration: InputDecoration(
                    hintText: 'Enter referral code',
                    hintStyle: AppTypography.bodyMedium.copyWith(
                      color: AppColors.grey400,
                    ),
                    filled: true,
                    fillColor: AppColors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    isDense: true,
                  ),
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.grey900,
                    letterSpacing: 1,
                  ),
                  textCapitalization: TextCapitalization.characters,
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 44,
                child: ElevatedButton(
                  onPressed: () {
                    final code = _codeController.text.trim();
                    if (code.isNotEmpty) {
                      context
                          .read<ReferralsBloc>()
                          .add(AcceptReferralEvent(code));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.white,
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Apply'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, int count) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(title, style: AppTypography.titleMedium),
        const Spacer(),
        if (count > 0)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$count',
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.primary,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildEmptySection(String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        children: [
          Text(
            title,
            style:
                AppTypography.bodyMedium.copyWith(color: AppColors.grey500),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: AppTypography.bodySmall.copyWith(color: AppColors.grey400),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildReferralCard(ReferralEntity referral) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withAlpha(4),
            blurRadius: 8,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _referralStatusColor(referral.status).withAlpha(30),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.person_rounded,
              size: 20,
              color: _referralStatusColor(referral.status),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  referral.refereeName ?? referral.referrerName ?? 'Unknown',
                  style: AppTypography.titleSmall,
                ),
                const SizedBox(height: 2),
                Text(
                  '${referral.merchantName ?? ''} \u00B7 ${_formatDate(referral.createdAt)}',
                  style: AppTypography.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          _buildStatusBadge(referral.status),
        ],
      ),
    );
  }

  Widget _buildRewardCard(ReferralRewardEntity reward) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withAlpha(4),
            blurRadius: 8,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.goldLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.card_giftcard_rounded,
              size: 20,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _rewardTypeLabel(reward.type),
                  style: AppTypography.titleSmall,
                ),
                const SizedBox(height: 2),
                Text(
                  '${reward.merchantName ?? ''} \u00B7 Value: ${reward.value}',
                  style: AppTypography.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (reward.expiresAt != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Expires ${_formatDate(reward.expiresAt!)}',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.grey400,
                    ),
                  ),
                ],
              ],
            ),
          ),
          _buildStatusBadge(reward.status),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final color = _referralStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        _capitalizeStatus(status),
        style: AppTypography.labelSmall.copyWith(color: color),
      ),
    );
  }

  Color _referralStatusColor(String status) {
    return switch (status) {
      'pending' => AppColors.warning,
      'accepted' => AppColors.success,
      'rewarded' => AppColors.primary,
      'available' => AppColors.success,
      'redeemed' => AppColors.grey500,
      'expired' => AppColors.error,
      _ => AppColors.grey500,
    };
  }

  String _rewardTypeLabel(String type) {
    return switch (type) {
      'discount_percentage' => 'Percentage Discount',
      'discount_fixed' => 'Fixed Discount',
      'free_product' => 'Free Product',
      _ => type,
    };
  }

  String _capitalizeStatus(String status) {
    if (status.isEmpty) return status;
    return status[0].toUpperCase() + status.substring(1);
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  Widget _buildAccepting() {
    return const Center(
      child: CircularProgressIndicator(color: AppColors.primary),
    );
  }

  Widget _buildShimmer() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: List.generate(
        4,
        (_) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ShimmerLoading.wrap(
            child: Container(
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
