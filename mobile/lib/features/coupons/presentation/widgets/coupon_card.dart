import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/coupon_entity.dart';

class CouponCard extends StatelessWidget {
  final CouponEntity coupon;
  final bool isClaiming;
  final VoidCallback? onClaim;

  const CouponCard({
    super.key,
    required this.coupon,
    this.isClaiming = false,
    this.onClaim,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Row(
          children: [
            // Discount badge on the left
            Container(
              width: 90,
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
              decoration: const BoxDecoration(
                gradient: AppColors.accentGradient,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _discountLabel(),
                    style: AppTypography.headlineSmall.copyWith(
                      color: AppColors.white,
                      fontSize: 20,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _discountSuffix(),
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.white.withAlpha(220),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            // Dashed divider effect
            Column(
              children: List.generate(8, (_) {
                return Container(
                  width: 1,
                  height: 6,
                  margin: const EdgeInsets.symmetric(vertical: 2),
                  color: AppColors.grey200,
                );
              }),
            ),
            // Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      coupon.name ?? coupon.code,
                      style: AppTypography.titleSmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.grey100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        coupon.code,
                        style: AppTypography.labelMedium.copyWith(
                          color: AppColors.grey600,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                    if (coupon.merchantName != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        coupon.merchantName!,
                        style: AppTypography.bodySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    if (coupon.expiresAt != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Expires ${_formatDate(coupon.expiresAt!)}',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.grey400,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    _buildActionButton(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _discountLabel() {
    if (coupon.discountType == 'percentage') {
      return '${coupon.discountValue}%';
    }
    return '\u20B1${coupon.discountValue}';
  }

  String _discountSuffix() {
    return 'OFF';
  }

  Widget _buildActionButton() {
    if (coupon.isClaimed) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.successLight,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          'Claimed',
          style: AppTypography.labelSmall.copyWith(
            color: AppColors.success,
          ),
        ),
      );
    }

    return SizedBox(
      height: 32,
      child: ElevatedButton(
        onPressed: isClaiming ? null : onClaim,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          textStyle: AppTypography.labelSmall,
        ),
        child: isClaiming
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.white,
                ),
              )
            : const Text('Claim'),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }
}
