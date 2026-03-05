import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/review_entity.dart';
import 'star_rating_display.dart';

class ReviewCard extends StatelessWidget {
  final ReviewEntity review;
  final bool showMerchant;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const ReviewCard({
    super.key,
    required this.review,
    this.showMerchant = false,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final bool hasActions = onEdit != null || onDelete != null;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.grey200),
      ),
      color: AppColors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: author info + actions
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildAvatar(),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        review.customer?.name ?? 'Anonymous',
                        style: AppTypography.titleSmall,
                      ),
                      const SizedBox(height: 2),
                      StarRatingDisplay(
                        rating: review.rating.toDouble(),
                        size: 16,
                      ),
                    ],
                  ),
                ),
                if (hasActions)
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, size: 20, color: AppColors.grey500),
                    onSelected: (value) {
                      if (value == 'edit') onEdit?.call();
                      if (value == 'delete') onDelete?.call();
                    },
                    itemBuilder: (context) => [
                      if (onEdit != null)
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit_outlined, size: 18),
                              SizedBox(width: 8),
                              Text('Edit'),
                            ],
                          ),
                        ),
                      if (onDelete != null)
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete_outline, size: 18, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Delete', style: TextStyle(color: Colors.red)),
                            ],
                          ),
                        ),
                    ],
                  ),
              ],
            ),

            // Merchant name (shown in My Reviews page)
            if (showMerchant && review.merchant != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.store_outlined, size: 14, color: AppColors.grey500),
                  const SizedBox(width: 4),
                  Text(
                    review.merchant!.name,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ],

            // Title
            if (review.title != null && review.title!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                review.title!,
                style: AppTypography.titleSmall,
              ),
            ],

            // Comment
            if (review.comment != null && review.comment!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                review.comment!,
                style: AppTypography.bodyMedium,
              ),
            ],

            // Footer: date + verified badge
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  _formatDate(review.createdAt),
                  style: AppTypography.bodySmall,
                ),
                if (review.isVerified) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.successLight,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.verified_outlined,
                          size: 12,
                          color: AppColors.success,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'Verified',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),

            // Merchant reply
            if (review.merchantReply != null && review.merchantReply!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.grey50,
                  borderRadius: BorderRadius.circular(8),
                  border: const Border(
                    left: BorderSide(color: AppColors.primary, width: 3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Response from owner',
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      review.merchantReply!,
                      style: AppTypography.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    final avatarUrl = review.customer?.avatarUrl;
    final name = review.customer?.name ?? '?';

    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      return CircleAvatar(
        radius: 18,
        backgroundImage: NetworkImage(avatarUrl),
        backgroundColor: AppColors.grey200,
      );
    }

    return CircleAvatar(
      radius: 18,
      backgroundColor: AppColors.primaryLight,
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: AppTypography.labelMedium.copyWith(color: AppColors.primary),
      ),
    );
  }

  String _formatDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate);
      return '${date.day} ${_monthName(date.month)} ${date.year}';
    } catch (_) {
      return isoDate;
    }
  }

  String _monthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return months[month - 1];
  }
}
