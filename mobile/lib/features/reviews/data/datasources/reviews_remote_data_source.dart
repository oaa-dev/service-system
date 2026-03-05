import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/review_model.dart';

abstract class ReviewsRemoteDataSource {
  Future<Either<Failure, List<ReviewModel>>> getMerchantReviews(
    String slug, {
    int page = 1,
  });

  Future<Either<Failure, ReviewModel>> createReview({
    required int merchantId,
    required int rating,
    String? title,
    String? comment,
  });

  Future<Either<Failure, ReviewModel>> updateReview({
    required int reviewId,
    required int rating,
    String? title,
    String? comment,
  });

  Future<Either<Failure, void>> deleteReview(int reviewId);

  Future<Either<Failure, List<ReviewModel>>> getMyReviews({int page = 1});
}

@LazySingleton(as: ReviewsRemoteDataSource)
class ReviewsRemoteDataSourceImpl implements ReviewsRemoteDataSource {
  final ApiClient _apiClient;

  const ReviewsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, List<ReviewModel>>> getMerchantReviews(
    String slug, {
    int page = 1,
  }) async {
    final result = await _apiClient.get(
      ApiConstants.merchantReviews(slug),
      queryParameters: {'page': page},
    );
    return result.map((json) {
      final data = json['data'] as List<dynamic>;
      return data
          .map((item) => ReviewModel.fromJson(item as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, ReviewModel>> createReview({
    required int merchantId,
    required int rating,
    String? title,
    String? comment,
  }) async {
    final body = <String, dynamic>{'rating': rating};
    if (title != null && title.isNotEmpty) body['title'] = title;
    if (comment != null && comment.isNotEmpty) body['comment'] = comment;

    final result = await _apiClient.post(
      ApiConstants.createReview(merchantId),
      data: body,
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return ReviewModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, ReviewModel>> updateReview({
    required int reviewId,
    required int rating,
    String? title,
    String? comment,
  }) async {
    final body = <String, dynamic>{'rating': rating};
    if (title != null && title.isNotEmpty) body['title'] = title;
    if (comment != null && comment.isNotEmpty) body['comment'] = comment;

    final result = await _apiClient.put(
      ApiConstants.updateReview(reviewId),
      data: body,
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return ReviewModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, void>> deleteReview(int reviewId) async {
    final result = await _apiClient.delete(ApiConstants.deleteReview(reviewId));
    return result.map((_) {});
  }

  @override
  Future<Either<Failure, List<ReviewModel>>> getMyReviews({int page = 1}) async {
    final result = await _apiClient.get(
      ApiConstants.myReviews,
      queryParameters: {'page': page},
    );
    return result.map((json) {
      final data = json['data'] as List<dynamic>;
      return data
          .map((item) => ReviewModel.fromJson(item as Map<String, dynamic>))
          .toList();
    });
  }
}
