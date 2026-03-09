import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/referral_code_entity.dart';
import '../../domain/entities/referral_entity.dart';
import '../../domain/entities/referral_reward_entity.dart';
import '../../domain/repositories/referrals_repository.dart';
import '../datasources/referrals_remote_data_source.dart';
import '../models/referral_code_model.dart';
import '../models/referral_model.dart';
import '../models/referral_reward_model.dart';

@LazySingleton(as: ReferralsRepository)
class ReferralsRepositoryImpl implements ReferralsRepository {
  final ReferralsRemoteDataSource _remote;

  const ReferralsRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<ReferralCodeEntity>>>
      getMyReferralCodes() async {
    final result = await _remote.getMyReferralCodes();
    return result.map((models) => models.map(_toCodeEntity).toList());
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> generateReferralCode(
      int merchantId) async {
    return _remote.generateReferralCode(merchantId);
  }

  @override
  Future<Either<Failure, List<ReferralEntity>>> getMyReferrals() async {
    final result = await _remote.getMyReferrals();
    return result.map((models) => models.map(_toReferralEntity).toList());
  }

  @override
  Future<Either<Failure, List<ReferralRewardEntity>>>
      getMyReferralRewards() async {
    final result = await _remote.getMyReferralRewards();
    return result.map((models) => models.map(_toRewardEntity).toList());
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> acceptReferral(
      String code) async {
    return _remote.acceptReferral(code);
  }

  ReferralCodeEntity _toCodeEntity(ReferralCodeModel model) =>
      ReferralCodeEntity(
        id: model.id,
        code: model.code,
        merchantName: model.merchantName,
        merchantId: model.merchantId,
        usesCount: model.usesCount ?? 0,
        expiresAt: model.expiresAt,
        createdAt: model.createdAt,
      );

  ReferralEntity _toReferralEntity(ReferralModel model) => ReferralEntity(
        id: model.id,
        referrerName: model.referrerName,
        refereeName: model.refereeName,
        status: model.status,
        merchantName: model.merchantName,
        createdAt: model.createdAt,
      );

  ReferralRewardEntity _toRewardEntity(ReferralRewardModel model) =>
      ReferralRewardEntity(
        id: model.id,
        type: model.type,
        value: model.value,
        status: model.status,
        merchantName: model.merchantName,
        expiresAt: model.expiresAt,
        createdAt: model.createdAt,
      );
}
