import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/favorites_repository.dart';

@lazySingleton
class ToggleFavoriteUseCase {
  final FavoritesRepository _repository;

  const ToggleFavoriteUseCase(this._repository);

  Future<Either<Failure, bool>> call(int merchantId) {
    return _repository.toggleFavorite(merchantId);
  }
}
