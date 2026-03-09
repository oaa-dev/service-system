import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/loyalty_reward_entity.dart';

class RewardCard extends StatelessWidget {
  final LoyaltyRewardEntity reward;

  const RewardCard({super.key, required this.reward});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _statusBackgroundColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _typeIcon,
              color: _statusForegroundColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(reward.name, style: AppTypography.titleSmall),
                const SizedBox(height: 2),
                Text(
                  _valueLabel,
                  style: AppTypography.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (reward.merchantName != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    reward.merchantName!,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.grey400,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 4),
                Row(
                  children: [
                    _buildStatusBadge(),
                    if (reward.expiresAt != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        'Expires: ${reward.expiresAt}',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.grey400,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData get _typeIcon {
    return switch (reward.type) {
      'free_product' => Icons.card_giftcard_rounded,
      'discount_percentage' => Icons.percent_rounded,
      'discount_fixed' => Icons.attach_money_rounded,
      _ => Icons.star_rounded,
    };
  }

  String get _valueLabel {
    return switch (reward.type) {
      'free_product' => 'Free product',
      'discount_percentage' => '${reward.value}% off',
      'discount_fixed' => '\u20B1${reward.value} off',
      _ => reward.value,
    };
  }

  Color get _statusForegroundColor {
    return switch (reward.status) {
      'available' => AppColors.success,
      'redeemed' => AppColors.grey500,
      'expired' => AppColors.error,
      _ => AppColors.grey500,
    };
  }

  Color get _statusBackgroundColor {
    return switch (reward.status) {
      'available' => AppColors.successLight,
      'redeemed' => AppColors.grey100,
      'expired' => AppColors.errorLight,
      _ => AppColors.grey100,
    };
  }

  Widget _buildStatusBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _statusBackgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        _formatStatus(reward.status),
        style: AppTypography.labelSmall.copyWith(
          color: _statusForegroundColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  static String _formatStatus(String status) {
    return status
        .split('_')
        .map((word) =>
            word.isEmpty ? '' : '${word[0].toUpperCase()}${word.substring(1)}')
        .join(' ');
  }
}
