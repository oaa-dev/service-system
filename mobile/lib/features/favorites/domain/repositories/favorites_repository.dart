import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/favorite_entity.dart';

abstract class FavoritesRepository {
  Future<Either<Failure, bool>> toggleFavorite(int merchantId);
  Future<Either<Failure, List<FavoriteMerchantEntity>>> getMyFavorites({
    int page = 1,
  });
}
