import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/referral_code_entity.dart';

class ReferralCodeCard extends StatelessWidget {
  final ReferralCodeEntity referralCode;

  const ReferralCodeCard({
    super.key,
    required this.referralCode,
  });

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Code display with copy button
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    referralCode.code,
                    style: AppTypography.titleMedium.copyWith(
                      color: AppColors.primary,
                      letterSpacing: 2,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => _copyCode(context),
                  icon: const Icon(Icons.copy_rounded, size: 20),
                  color: AppColors.primary,
                  padding: EdgeInsets.zero,
                  constraints:
                      const BoxConstraints(minWidth: 36, minHeight: 36),
                  tooltip: 'Copy code',
                ),
                const SizedBox(width: 4),
                IconButton(
                  onPressed: () => _copyCode(context),
                  icon: const Icon(Icons.share_rounded, size: 20),
                  color: AppColors.primary,
                  padding: EdgeInsets.zero,
                  constraints:
                      const BoxConstraints(minWidth: 36, minHeight: 36),
                  tooltip: 'Share code',
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Details row
          Row(
            children: [
              if (referralCode.merchantName != null) ...[
                Icon(Icons.store_rounded,
                    size: 14, color: AppColors.grey400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    referralCode.merchantName!,
                    style: AppTypography.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
              const Spacer(),
              Icon(Icons.people_rounded, size: 14, color: AppColors.grey400),
              const SizedBox(width: 4),
              Text(
                '${referralCode.usesCount} uses',
                style: AppTypography.labelSmall,
              ),
            ],
          ),
          if (referralCode.expiresAt != null) ...[
            const SizedBox(height: 4),
            Text(
              'Expires ${_formatDate(referralCode.expiresAt!)}',
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.grey400,
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _copyCode(BuildContext context) {
    Clipboard.setData(ClipboardData(text: referralCode.code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Referral code copied to clipboard'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        duration: const Duration(seconds: 2),
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
