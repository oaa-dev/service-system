import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class StarRatingDisplay extends StatelessWidget {
  final double rating;
  final double size;
  final bool showLabel;

  const StarRatingDisplay({
    super.key,
    required this.rating,
    this.size = 18,
    this.showLabel = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(5, (index) {
          final starValue = index + 1;
          if (rating >= starValue) {
            return Padding(
              padding: const EdgeInsets.only(right: 2),
              child: Icon(Icons.star_rounded, size: size, color: AppColors.gold),
            );
          } else if (rating >= starValue - 0.5) {
            return Padding(
              padding: const EdgeInsets.only(right: 2),
              child:
                  Icon(Icons.star_half_rounded, size: size, color: AppColors.gold),
            );
          } else {
            return Padding(
              padding: const EdgeInsets.only(right: 2),
              child:
                  Icon(Icons.star_rounded, size: size, color: AppColors.grey200),
            );
          }
        }),
        if (showLabel) ...[
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.grey700,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
    );
  }
}
