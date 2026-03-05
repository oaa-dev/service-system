import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/favorite_entity.dart';
import '../repositories/favorites_repository.dart';

@lazySingleton
class GetMyFavoritesUseCase {
  final FavoritesRepository _repository;

  const GetMyFavoritesUseCase(this._repository);

  Future<Either<Failure, List<FavoriteMerchantEntity>>> call({int page = 1}) {
    return _repository.getMyFavorites(page: page);
  }
}
