import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/referral_code_entity.dart';
import '../entities/referral_entity.dart';
import '../entities/referral_reward_entity.dart';

abstract class ReferralsRepository {
  Future<Either<Failure, List<ReferralCodeEntity>>> getMyReferralCodes();
  Future<Either<Failure, Map<String, dynamic>>> generateReferralCode(
      int merchantId);
  Future<Either<Failure, List<ReferralEntity>>> getMyReferrals();
  Future<Either<Failure, List<ReferralRewardEntity>>> getMyReferralRewards();
  Future<Either<Failure, Map<String, dynamic>>> acceptReferral(String code);
}
