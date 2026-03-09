import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/loyalty_card_entity.dart';
import '../repositories/loyalty_repository.dart';

@lazySingleton
class GetMyLoyaltyCardsUseCase {
  final LoyaltyRepository _repository;

  const GetMyLoyaltyCardsUseCase(this._repository);

  Future<Either<Failure, List<LoyaltyCardEntity>>> call() {
    return _repository.getMyCards();
  }
}
