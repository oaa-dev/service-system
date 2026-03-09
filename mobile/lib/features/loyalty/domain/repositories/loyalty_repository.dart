import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/loyalty_card_entity.dart';
import '../entities/loyalty_reward_entity.dart';
import '../entities/scan_result_entity.dart';

abstract class LoyaltyRepository {
  Future<Either<Failure, List<LoyaltyCardEntity>>> getMyCards();
  Future<Either<Failure, LoyaltyCardEntity>> getCardDetail(int id);
  Future<Either<Failure, List<LoyaltyRewardEntity>>> getMyRewards();
  Future<Either<Failure, ScanResultEntity>> scanQrCode(String token);
}
