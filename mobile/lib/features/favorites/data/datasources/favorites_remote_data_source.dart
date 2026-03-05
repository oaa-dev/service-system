import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/favorite_model.dart';

abstract class FavoritesRemoteDataSource {
  Future<Either<Failure, bool>> toggleFavorite(int merchantId);
  Future<Either<Failure, List<FavoriteMerchantModel>>> getMyFavorites({
    int page = 1,
  });
}

@LazySingleton(as: FavoritesRemoteDataSource)
class FavoritesRemoteDataSourceImpl implements FavoritesRemoteDataSource {
  final ApiClient _apiClient;

  const FavoritesRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, bool>> toggleFavorite(int merchantId) async {
    final result = await _apiClient.post(
      ApiConstants.toggleFavorite(merchantId),
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return data['is_favorited'] as bool;
    });
  }

  @override
  Future<Either<Failure, List<FavoriteMerchantModel>>> getMyFavorites({
    int page = 1,
  }) async {
    final result = await _apiClient.get(
      ApiConstants.myFavorites,
      queryParameters: {'page': page},
    );
    return result.map((json) {
      final dataList = json['data'] as List<dynamic>;
      return dataList
          .map(
            (e) => FavoriteMerchantModel.fromJson(e as Map<String, dynamic>),
          )
          .toList();
    });
  }
}
