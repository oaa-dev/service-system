import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/reviews_repository.dart';

@lazySingleton
class DeleteReviewUseCase {
  final ReviewsRepository _repository;

  const DeleteReviewUseCase(this._repository);

  Future<Either<Failure, void>> call(int reviewId) {
    return _repository.deleteReview(reviewId);
  }
}
