import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/app_button.dart';
import '../../domain/entities/review_entity.dart';
import '../bloc/reviews/reviews_bloc.dart';
import '../bloc/reviews/reviews_event.dart';
import '../bloc/write_review/write_review_bloc.dart';
import '../bloc/write_review/write_review_event.dart';
import '../bloc/write_review/write_review_state.dart';
import 'star_rating_input.dart';

class WriteReviewSheet extends StatefulWidget {
  final int merchantId;
  final ReviewEntity? existingReview;

  const WriteReviewSheet({
    super.key,
    required this.merchantId,
    this.existingReview,
  });

  @override
  State<WriteReviewSheet> createState() => _WriteReviewSheetState();
}

class _WriteReviewSheetState extends State<WriteReviewSheet> {
  late double _rating;
  late TextEditingController _titleController;
  late TextEditingController _commentController;

  bool get _isEditing => widget.existingReview != null;

  @override
  void initState() {
    super.initState();
    _rating = widget.existingReview?.rating.toDouble() ?? 5.0;
    _titleController = TextEditingController(
      text: widget.existingReview?.title ?? '',
    );
    _commentController = TextEditingController(
      text: widget.existingReview?.comment ?? '',
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  void _submit() {
    final title = _titleController.text.trim();
    final comment = _commentController.text.trim();

    if (_isEditing) {
      context.read<WriteReviewBloc>().add(UpdateReviewSubmitEvent(
            reviewId: widget.existingReview!.id,
            rating: _rating.round(),
            title: title.isEmpty ? null : title,
            comment: comment.isEmpty ? null : comment,
          ));
    } else {
      context.read<WriteReviewBloc>().add(SubmitReviewEvent(
            merchantId: widget.merchantId,
            rating: _rating.round(),
            title: title.isEmpty ? null : title,
            comment: comment.isEmpty ? null : comment,
          ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<WriteReviewBloc, WriteReviewState>(
      listener: (context, state) {
        if (state is WriteReviewSuccess) {
          if (_isEditing) {
            context.read<ReviewsBloc>().add(ReviewUpdatedEvent(state.review));
          } else {
            context.read<ReviewsBloc>().add(ReviewCreatedEvent(state.review));
          }
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_isEditing
                  ? 'Review updated successfully'
                  : 'Review submitted successfully'),
              backgroundColor: AppColors.success,
            ),
          );
        } else if (state is WriteReviewNoTransaction) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You need to complete a booking with this merchant before leaving a review.'),
              backgroundColor: AppColors.warning,
            ),
          );
        } else if (state is WriteReviewDuplicate) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("You've already reviewed this merchant."),
              backgroundColor: AppColors.warning,
            ),
          );
        } else if (state is WriteReviewError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        final isSubmitting = state is WriteReviewSubmitting;

        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Container(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
            decoration: const BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle bar
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.grey300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Title
                  Text(
                    _isEditing ? 'Edit your review' : 'Write a review',
                    style: AppTypography.headlineSmall,
                  ),
                  const SizedBox(height: 24),

                  // Star rating
                  Text('Your rating', style: AppTypography.labelLarge),
                  const SizedBox(height: 8),
                  Center(
                    child: StarRatingInput(
                      initialRating: _rating,
                      onRatingUpdate: (value) {
                        setState(() => _rating = value);
                      },
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Title field
                  Text('Title (optional)', style: AppTypography.labelLarge),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _titleController,
                    enabled: !isSubmitting,
                    decoration: InputDecoration(
                      hintText: 'Summarize your experience',
                      hintStyle: AppTypography.bodyMedium.copyWith(
                        color: AppColors.grey400,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.grey300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.grey300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                    ),
                    style: AppTypography.bodyMedium,
                  ),
                  const SizedBox(height: 16),

                  // Comment field
                  Text('Comment (optional)', style: AppTypography.labelLarge),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _commentController,
                    enabled: !isSubmitting,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Share your experience in detail...',
                      hintStyle: AppTypography.bodyMedium.copyWith(
                        color: AppColors.grey400,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.grey300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.grey300),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                    ),
                    style: AppTypography.bodyMedium,
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  AppButton(
                    label: isSubmitting
                        ? 'Submitting...'
                        : (_isEditing ? 'Update Review' : 'Submit Review'),
                    onPressed: isSubmitting ? null : _submit,
                    isLoading: isSubmitting,
                    width: double.infinity,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
