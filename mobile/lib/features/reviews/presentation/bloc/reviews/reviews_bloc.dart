import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/entities/review_entity.dart';
import '../../../domain/usecases/delete_review_use_case.dart';
import '../../../domain/usecases/get_merchant_reviews_use_case.dart';
import '../../../domain/usecases/get_my_reviews_use_case.dart';
import 'reviews_event.dart';
import 'reviews_state.dart';

@injectable
class ReviewsBloc extends Bloc<ReviewsEvent, ReviewsState> {
  final GetMerchantReviewsUseCase _getMerchantReviews;
  final GetMyReviewsUseCase _getMyReviews;
  final DeleteReviewUseCase _deleteReview;

  ReviewsBloc(
    this._getMerchantReviews,
    this._getMyReviews,
    this._deleteReview,
  ) : super(const ReviewsInitial()) {
    on<LoadMerchantReviewsEvent>(_onLoadMerchantReviews);
    on<LoadMyReviewsEvent>(_onLoadMyReviews);
    on<DeleteReviewEvent>(_onDeleteReview);
    on<ReviewCreatedEvent>(_onReviewCreated);
    on<ReviewUpdatedEvent>(_onReviewUpdated);
  }

  Future<void> _onLoadMerchantReviews(
    LoadMerchantReviewsEvent event,
    Emitter<ReviewsState> emit,
  ) async {
    emit(const ReviewsLoading());
    final result = await _getMerchantReviews(event.merchantSlug);
    result.fold(
      (failure) => emit(ReviewsError(failure.message)),
      (reviews) {
        final averageRating = _computeAverage(reviews);
        emit(ReviewsLoaded(
          reviews: reviews,
          averageRating: averageRating,
          reviewCount: reviews.length,
        ));
      },
    );
  }

  Future<void> _onLoadMyReviews(
    LoadMyReviewsEvent event,
    Emitter<ReviewsState> emit,
  ) async {
    emit(const ReviewsLoading());
    final result = await _getMyReviews();
    result.fold(
      (failure) => emit(ReviewsError(failure.message)),
      (reviews) {
        final averageRating = _computeAverage(reviews);
        emit(ReviewsLoaded(
          reviews: reviews,
          averageRating: averageRating,
          reviewCount: reviews.length,
        ));
      },
    );
  }

  Future<void> _onDeleteReview(
    DeleteReviewEvent event,
    Emitter<ReviewsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ReviewsLoaded) return;

    final result = await _deleteReview(event.reviewId);
    result.fold(
      (failure) => emit(ReviewsError(failure.message)),
      (_) {
        final updatedReviews = currentState.reviews
            .where((r) => r.id != event.reviewId)
            .toList();
        final averageRating = _computeAverage(updatedReviews);
        emit(currentState.copyWith(
          reviews: updatedReviews,
          averageRating: averageRating,
          reviewCount: updatedReviews.length,
        ));
      },
    );
  }

  void _onReviewCreated(
    ReviewCreatedEvent event,
    Emitter<ReviewsState> emit,
  ) {
    final currentState = state;
    if (currentState is ReviewsLoaded) {
      final updatedReviews = [event.review, ...currentState.reviews];
      final averageRating = _computeAverage(updatedReviews);
      emit(currentState.copyWith(
        reviews: updatedReviews,
        averageRating: averageRating,
        reviewCount: updatedReviews.length,
      ));
    } else {
      final reviews = [event.review];
      emit(ReviewsLoaded(
        reviews: reviews,
        averageRating: event.review.rating.toDouble(),
        reviewCount: 1,
      ));
    }
  }

  void _onReviewUpdated(
    ReviewUpdatedEvent event,
    Emitter<ReviewsState> emit,
  ) {
    final currentState = state;
    if (currentState is! ReviewsLoaded) return;

    final updatedReviews = currentState.reviews.map((r) {
      return r.id == event.review.id ? event.review : r;
    }).toList();
    final averageRating = _computeAverage(updatedReviews);
    emit(currentState.copyWith(
      reviews: updatedReviews,
      averageRating: averageRating,
    ));
  }

  double? _computeAverage(List<ReviewEntity> reviews) {
    if (reviews.isEmpty) return null;
    final sum = reviews.fold<int>(0, (acc, r) => acc + r.rating);
    return sum / reviews.length;
  }
}
