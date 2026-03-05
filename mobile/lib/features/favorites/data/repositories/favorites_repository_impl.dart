import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/favorite_entity.dart';
import '../../domain/repositories/favorites_repository.dart';
import '../datasources/favorites_remote_data_source.dart';
import '../models/favorite_model.dart';

@LazySingleton(as: FavoritesRepository)
class FavoritesRepositoryImpl implements FavoritesRepository {
  final FavoritesRemoteDataSource _remote;

  const FavoritesRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, bool>> toggleFavorite(int merchantId) async {
    return _remote.toggleFavorite(merchantId);
  }

  @override
  Future<Either<Failure, List<FavoriteMerchantEntity>>> getMyFavorites({
    int page = 1,
  }) async {
    final result = await _remote.getMyFavorites(page: page);
    return result.map(
      (models) => models.map(_toEntity).toList(),
    );
  }

  FavoriteMerchantEntity _toEntity(FavoriteMerchantModel model) {
    String? city;
    if (model.address != null) {
      final address = model.address!;
      // Try nested city object first (geo FK), then fall back to string
      final cityObj = address['city'] as Map<String, dynamic>?;
      if (cityObj != null) {
        city = cityObj['name'] as String?;
      } else {
        city = address['city'] as String?;
      }
    }

    return FavoriteMerchantEntity(
      id: model.id,
      name: model.name,
      slug: model.slug,
      logoUrl: model.logoUrl,
      averageRating: model.averageRating,
      reviewCount: model.reviewCount,
      city: city,
    );
  }
}
