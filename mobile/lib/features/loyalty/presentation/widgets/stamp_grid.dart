import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class StampGrid extends StatelessWidget {
  final int current;
  final int total;

  const StampGrid({
    super.key,
    required this.current,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    if (total > 20) {
      return _buildCompactView();
    }
    return _buildGrid();
  }

  Widget _buildCompactView() {
    return Column(
      children: [
        Text(
          '$current / $total',
          style: AppTypography.headlineMedium.copyWith(
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'stamps collected',
          style: AppTypography.bodySmall,
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: total > 0 ? current / total : 0,
            minHeight: 8,
            backgroundColor: AppColors.grey200,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
      ],
    );
  }

  Widget _buildGrid() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: List.generate(total, (index) {
        final isFilled = index < current;
        return Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isFilled ? AppColors.primary : AppColors.white,
            border: Border.all(
              color: isFilled ? AppColors.primary : AppColors.grey300,
              width: 2,
            ),
          ),
          child: isFilled
              ? const Icon(
                  Icons.check_rounded,
                  color: AppColors.white,
                  size: 20,
                )
              : null,
        );
      }),
    );
  }
}
