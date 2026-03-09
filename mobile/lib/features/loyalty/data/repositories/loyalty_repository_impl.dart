import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/loyalty_card_entity.dart';
import '../../domain/entities/loyalty_reward_entity.dart';
import '../../domain/entities/scan_result_entity.dart';
import '../../domain/repositories/loyalty_repository.dart';
import '../datasources/loyalty_remote_data_source.dart';
import '../models/loyalty_card_model.dart';
import '../models/loyalty_reward_model.dart';
import '../models/scan_result_model.dart';

@LazySingleton(as: LoyaltyRepository)
class LoyaltyRepositoryImpl implements LoyaltyRepository {
  final LoyaltyRemoteDataSource _remote;

  const LoyaltyRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<LoyaltyCardEntity>>> getMyCards() async {
    final result = await _remote.getMyCards();
    return result.map((models) => models.map(_toCardEntity).toList());
  }

  @override
  Future<Either<Failure, LoyaltyCardEntity>> getCardDetail(int id) async {
    final result = await _remote.getCardDetail(id);
    return result.map(_toCardEntity);
  }

  @override
  Future<Either<Failure, List<LoyaltyRewardEntity>>> getMyRewards() async {
    final result = await _remote.getMyRewards();
    return result.map((models) => models.map(_toRewardEntity).toList());
  }

  @override
  Future<Either<Failure, ScanResultEntity>> scanQrCode(String token) async {
    final result = await _remote.scanQrCode(token);
    return result.map(_toScanResultEntity);
  }

  // -- Mappers --

  LoyaltyCardEntity _toCardEntity(LoyaltyCardModel model) => LoyaltyCardEntity(
        id: model.id,
        merchantName: model.merchantName,
        merchantLogo: model.merchantLogo,
        programName: model.programName,
        currentStamps: model.currentStamps,
        requiredStamps: model.requiredStamps,
        totalStampsEarned: model.totalStampsEarned,
        totalRewardsEarned: model.totalRewardsEarned,
        status: model.status,
      );

  LoyaltyRewardEntity _toRewardEntity(LoyaltyRewardModel model) =>
      LoyaltyRewardEntity(
        id: model.id,
        name: model.name,
        description: model.description,
        type: model.type,
        value: model.value,
        status: model.status,
        expiresAt: model.expiresAt,
        merchantName: model.merchantName,
      );

  ScanResultEntity _toScanResultEntity(ScanResultModel model) =>
      ScanResultEntity(
        success: model.success,
        message: model.message,
        stampsAdded: model.stampsAdded,
        currentStamps: model.currentStamps,
        rewardUnlocked: model.rewardUnlocked,
      );
}
