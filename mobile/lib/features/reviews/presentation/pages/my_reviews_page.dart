import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/injection.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/review_entity.dart';
import '../bloc/reviews/reviews_bloc.dart';
import '../bloc/reviews/reviews_event.dart';
import '../bloc/reviews/reviews_state.dart';
import '../bloc/write_review/write_review_bloc.dart';
import '../widgets/review_card.dart';
import '../widgets/write_review_sheet.dart';

class MyReviewsPage extends StatefulWidget {
  const MyReviewsPage({super.key});

  @override
  State<MyReviewsPage> createState() => _MyReviewsPageState();
}

class _MyReviewsPageState extends State<MyReviewsPage> {
  @override
  void initState() {
    super.initState();
    context.read<ReviewsBloc>().add(const LoadMyReviewsEvent());
  }

  void _openEditSheet(BuildContext context, ReviewEntity review) {
    final reviewsBloc = context.read<ReviewsBloc>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MultiBlocProvider(
        providers: [
          BlocProvider<ReviewsBloc>.value(value: reviewsBloc),
          BlocProvider<WriteReviewBloc>(
            create: (_) => getIt<WriteReviewBloc>(),
          ),
        ],
        child: WriteReviewSheet(
          merchantId: review.merchant?.id ?? 0,
          existingReview: review,
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, ReviewEntity review) {
    final reviewsBloc = context.read<ReviewsBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete Review'),
        content: const Text(
          'Are you sure you want to delete this review? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              reviewsBloc.add(DeleteReviewEvent(review.id));
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Reviews', style: AppTypography.titleLarge),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.grey900,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppColors.grey200),
        ),
      ),
      backgroundColor: AppColors.surface,
      body: BlocBuilder<ReviewsBloc, ReviewsState>(
        builder: (context, state) {
          if (state is ReviewsLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is ReviewsError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                    const SizedBox(height: 12),
                    Text(
                      state.message,
                      style: AppTypography.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () =>
                          context.read<ReviewsBloc>().add(const LoadMyReviewsEvent()),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is ReviewsLoaded) {
            if (state.reviews.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.rate_review_outlined,
                        size: 64,
                        color: AppColors.grey300,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        "You haven't written any reviews yet.",
                        style: AppTypography.bodyLarge,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Complete a booking and share your experience!',
                        style: AppTypography.bodySmall,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<ReviewsBloc>().add(const LoadMyReviewsEvent());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.reviews.length,
                itemBuilder: (context, index) {
                  final review = state.reviews[index];
                  return ReviewCard(
                    review: review,
                    showMerchant: true,
                    onEdit: () => _openEditSheet(context, review),
                    onDelete: () => _confirmDelete(context, review),
                  );
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
