import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/loyalty_reward_entity.dart';
import '../repositories/loyalty_repository.dart';

@lazySingleton
class GetMyRewardsUseCase {
  final LoyaltyRepository _repository;

  const GetMyRewardsUseCase(this._repository);

  Future<Either<Failure, List<LoyaltyRewardEntity>>> call() {
    return _repository.getMyRewards();
  }
}
