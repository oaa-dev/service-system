import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/referral_reward_entity.dart';
import '../repositories/referrals_repository.dart';

@lazySingleton
class GetMyReferralRewardsUseCase {
  final ReferralsRepository _repository;

  const GetMyReferralRewardsUseCase(this._repository);

  Future<Either<Failure, List<ReferralRewardEntity>>> call() {
    return _repository.getMyReferralRewards();
  }
}
