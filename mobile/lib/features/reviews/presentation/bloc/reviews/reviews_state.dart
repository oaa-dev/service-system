import 'package:equatable/equatable.dart';
import '../../../domain/entities/review_entity.dart';

sealed class ReviewsState extends Equatable {
  const ReviewsState();

  @override
  List<Object?> get props => [];
}

class ReviewsInitial extends ReviewsState {
  const ReviewsInitial();
}

class ReviewsLoading extends ReviewsState {
  const ReviewsLoading();
}

class ReviewsLoaded extends ReviewsState {
  final List<ReviewEntity> reviews;
  final double? averageRating;
  final int reviewCount;

  const ReviewsLoaded({
    required this.reviews,
    this.averageRating,
    this.reviewCount = 0,
  });

  @override
  List<Object?> get props => [reviews, averageRating, reviewCount];

  ReviewsLoaded copyWith({
    List<ReviewEntity>? reviews,
    double? averageRating,
    int? reviewCount,
  }) {
    return ReviewsLoaded(
      reviews: reviews ?? this.reviews,
      averageRating: averageRating ?? this.averageRating,
      reviewCount: reviewCount ?? this.reviewCount,
    );
  }
}

class ReviewsError extends ReviewsState {
  final String message;

  const ReviewsError(this.message);

  @override
  List<Object?> get props => [message];
}
