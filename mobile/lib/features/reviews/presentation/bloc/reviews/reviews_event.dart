import 'package:equatable/equatable.dart';
import '../../../domain/entities/review_entity.dart';

sealed class ReviewsEvent extends Equatable {
  const ReviewsEvent();

  @override
  List<Object?> get props => [];
}

class LoadMerchantReviewsEvent extends ReviewsEvent {
  final String merchantSlug;

  const LoadMerchantReviewsEvent(this.merchantSlug);

  @override
  List<Object?> get props => [merchantSlug];
}

class LoadMyReviewsEvent extends ReviewsEvent {
  const LoadMyReviewsEvent();
}

class DeleteReviewEvent extends ReviewsEvent {
  final int reviewId;

  const DeleteReviewEvent(this.reviewId);

  @override
  List<Object?> get props => [reviewId];
}

class ReviewCreatedEvent extends ReviewsEvent {
  final ReviewEntity review;

  const ReviewCreatedEvent(this.review);

  @override
  List<Object?> get props => [review];
}

class ReviewUpdatedEvent extends ReviewsEvent {
  final ReviewEntity review;

  const ReviewUpdatedEvent(this.review);

  @override
  List<Object?> get props => [review];
}
