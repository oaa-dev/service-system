import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/review_entity.dart';
import '../repositories/reviews_repository.dart';

@lazySingleton
class UpdateReviewUseCase {
  final ReviewsRepository _repository;

  const UpdateReviewUseCase(this._repository);

  Future<Either<Failure, ReviewEntity>> call({
    required int reviewId,
    required int rating,
    String? title,
    String? comment,
  }) {
    return _repository.updateReview(
      reviewId: reviewId,
      rating: rating,
      title: title,
      comment: comment,
    );
  }
}
