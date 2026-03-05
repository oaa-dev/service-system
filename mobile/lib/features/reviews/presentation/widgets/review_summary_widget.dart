import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'star_rating_display.dart';

class ReviewSummaryWidget extends StatelessWidget {
  final double? averageRating;
  final int reviewCount;

  const ReviewSummaryWidget({
    super.key,
    required this.averageRating,
    required this.reviewCount,
  });

  @override
  Widget build(BuildContext context) {
    if (reviewCount == 0) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text(
          'No reviews yet',
          style: AppTypography.bodyMedium,
        ),
      );
    }

    final displayRating = averageRating ?? 0.0;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          displayRating.toStringAsFixed(1),
          style: AppTypography.headlineLarge.copyWith(
            color: AppColors.grey900,
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            StarRatingDisplay(rating: displayRating, size: 20),
            const SizedBox(height: 4),
            Text(
              '$reviewCount ${reviewCount == 1 ? 'review' : 'reviews'}',
              style: AppTypography.bodySmall,
            ),
          ],
        ),
      ],
    );
  }
}
