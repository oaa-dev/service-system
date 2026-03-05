import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/review_entity.dart';

abstract class ReviewsRepository {
  Future<Either<Failure, List<ReviewEntity>>> getMerchantReviews(
    String slug, {
    int page = 1,
  });

  Future<Either<Failure, ReviewEntity>> createReview({
    required int merchantId,
    required int rating,
    String? title,
    String? comment,
  });

  Future<Either<Failure, ReviewEntity>> updateReview({
    required int reviewId,
    required int rating,
    String? title,
    String? comment,
  });

  Future<Either<Failure, void>> deleteReview(int reviewId);

  Future<Either<Failure, List<ReviewEntity>>> getMyReviews({int page = 1});
}
