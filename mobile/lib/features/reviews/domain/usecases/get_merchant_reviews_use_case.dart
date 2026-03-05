import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/review_entity.dart';
import '../repositories/reviews_repository.dart';

@lazySingleton
class GetMerchantReviewsUseCase {
  final ReviewsRepository _repository;

  const GetMerchantReviewsUseCase(this._repository);

  Future<Either<Failure, List<ReviewEntity>>> call(String slug, {int page = 1}) {
    return _repository.getMerchantReviews(slug, page: page);
  }
}
