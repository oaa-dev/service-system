import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final colors = _getStatusColors(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        _formatStatus(status),
        style: AppTypography.labelSmall.copyWith(
          color: colors.foreground,
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

  static _StatusColors _getStatusColors(String status) {
    return switch (status) {
      'pending' => _StatusColors(AppColors.warning, AppColors.warningLight),
      'confirmed' => _StatusColors(AppColors.primary, AppColors.primaryLight),
      'completed' => _StatusColors(AppColors.success, AppColors.successLight),
      'cancelled' => _StatusColors(AppColors.error, AppColors.errorLight),
      'no_show' => _StatusColors(AppColors.grey500, AppColors.grey100),
      'checked_in' => _StatusColors(AppColors.primary, AppColors.primaryLight),
      'checked_out' =>
        _StatusColors(AppColors.success, AppColors.successLight),
      'received' => _StatusColors(AppColors.primary, AppColors.primaryLight),
      'processing' =>
        _StatusColors(AppColors.secondary, AppColors.secondaryLight),
      'ready' => _StatusColors(AppColors.gold, AppColors.goldLight),
      'delivering' => _StatusColors(AppColors.warning, AppColors.warningLight),
      _ => _StatusColors(AppColors.grey500, AppColors.grey100),
    };
  }
}

class _StatusColors {
  final Color foreground;
  final Color background;

  const _StatusColors(this.foreground, this.background);
}
