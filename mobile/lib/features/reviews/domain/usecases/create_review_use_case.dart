import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/review_entity.dart';
import '../repositories/reviews_repository.dart';

@lazySingleton
class CreateReviewUseCase {
  final ReviewsRepository _repository;

  const CreateReviewUseCase(this._repository);

  Future<Either<Failure, ReviewEntity>> call({
    required int merchantId,
    required int rating,
    String? title,
    String? comment,
  }) {
    return _repository.createReview(
      merchantId: merchantId,
      rating: rating,
      title: title,
      comment: comment,
    );
  }
}
