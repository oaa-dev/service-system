import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/loyalty_card_entity.dart';
import '../repositories/loyalty_repository.dart';

@lazySingleton
class GetLoyaltyCardDetailUseCase {
  final LoyaltyRepository _repository;

  const GetLoyaltyCardDetailUseCase(this._repository);

  Future<Either<Failure, LoyaltyCardEntity>> call(int id) {
    return _repository.getCardDetail(id);
  }
}
