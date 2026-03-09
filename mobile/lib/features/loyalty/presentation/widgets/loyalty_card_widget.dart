import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/loyalty_card_entity.dart';

class LoyaltyCardWidget extends StatelessWidget {
  final LoyaltyCardEntity card;
  final VoidCallback onTap;

  const LoyaltyCardWidget({
    super.key,
    required this.card,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withAlpha(60),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: merchant logo + program name + status
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.white.withAlpha(50),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: card.merchantLogo != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              card.merchantLogo!,
                              fit: BoxFit.cover,
                              width: 40,
                              height: 40,
                              errorBuilder: (_, _, _) => const Icon(
                                Icons.loyalty_rounded,
                                color: AppColors.white,
                                size: 22,
                              ),
                            ),
                          )
                        : const Icon(
                            Icons.loyalty_rounded,
                            color: AppColors.white,
                            size: 22,
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          card.programName,
                          style: AppTypography.titleSmall.copyWith(
                            color: AppColors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (card.merchantName != null)
                          Text(
                            card.merchantName!,
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.white.withAlpha(180),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  _buildStatusBadge(),
                ],
              ),
              const SizedBox(height: 20),
              // Progress bar
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: card.requiredStamps > 0
                      ? card.currentStamps / card.requiredStamps
                      : 0,
                  minHeight: 8,
                  backgroundColor: AppColors.white.withAlpha(50),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    AppColors.gold,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // Stamp count + rewards info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${card.currentStamps} / ${card.requiredStamps} stamps',
                    style: AppTypography.titleSmall.copyWith(
                      color: AppColors.white,
                    ),
                  ),
                  if (card.totalRewardsEarned > 0)
                    Text(
                      '${card.totalRewardsEarned} rewards earned',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.white.withAlpha(180),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    final (bgColor, fgColor) = switch (card.status) {
      'active' => (AppColors.white.withAlpha(50), AppColors.white),
      'completed' => (AppColors.gold.withAlpha(50), AppColors.gold),
      'expired' => (AppColors.error.withAlpha(50), AppColors.errorLight),
      _ => (AppColors.white.withAlpha(50), AppColors.white),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        _formatStatus(card.status),
        style: AppTypography.labelSmall.copyWith(
          color: fgColor,
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
