import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/review_entity.dart';
import '../../domain/repositories/reviews_repository.dart';
import '../datasources/reviews_remote_data_source.dart';
import '../models/review_model.dart';

@LazySingleton(as: ReviewsRepository)
class ReviewsRepositoryImpl implements ReviewsRepository {
  final ReviewsRemoteDataSource _remote;

  const ReviewsRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<ReviewEntity>>> getMerchantReviews(
    String slug, {
    int page = 1,
  }) async {
    final result = await _remote.getMerchantReviews(slug, page: page);
    return result.map((models) => models.map(_toEntity).toList());
  }

  @override
  Future<Either<Failure, ReviewEntity>> createReview({
    required int merchantId,
    required int rating,
    String? title,
    String? comment,
  }) async {
    final result = await _remote.createReview(
      merchantId: merchantId,
      rating: rating,
      title: title,
      comment: comment,
    );
    return result.map(_toEntity);
  }

  @override
  Future<Either<Failure, ReviewEntity>> updateReview({
    required int reviewId,
    required int rating,
    String? title,
    String? comment,
  }) async {
    final result = await _remote.updateReview(
      reviewId: reviewId,
      rating: rating,
      title: title,
      comment: comment,
    );
    return result.map(_toEntity);
  }

  @override
  Future<Either<Failure, void>> deleteReview(int reviewId) async {
    return _remote.deleteReview(reviewId);
  }

  @override
  Future<Either<Failure, List<ReviewEntity>>> getMyReviews({int page = 1}) async {
    final result = await _remote.getMyReviews(page: page);
    return result.map((models) => models.map(_toEntity).toList());
  }

  ReviewEntity _toEntity(ReviewModel model) => ReviewEntity(
        id: model.id,
        rating: model.rating,
        title: model.title,
        comment: model.comment,
        isVerified: model.isVerified,
        isPublished: model.isPublished,
        merchantReply: model.merchantReply,
        merchantRepliedAt: model.merchantRepliedAt,
        createdAt: model.createdAt,
        customer: model.customer != null
            ? ReviewCustomerEntity(
                id: model.customer!.id,
                name: model.customer!.name,
                avatarUrl: model.customer!.avatar,
              )
            : null,
        merchant: model.merchant != null
            ? ReviewMerchantEntity(
                id: model.merchant!.id,
                name: model.merchant!.name,
                slug: model.merchant!.slug,
                logoUrl: model.merchant!.logoUrl,
              )
            : null,
      );
}
