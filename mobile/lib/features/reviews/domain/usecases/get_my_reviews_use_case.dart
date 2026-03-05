import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/review_entity.dart';
import '../repositories/reviews_repository.dart';

@lazySingleton
class GetMyReviewsUseCase {
  final ReviewsRepository _repository;

  const GetMyReviewsUseCase(this._repository);

  Future<Either<Failure, List<ReviewEntity>>> call({int page = 1}) {
    return _repository.getMyReviews(page: page);
  }
}
