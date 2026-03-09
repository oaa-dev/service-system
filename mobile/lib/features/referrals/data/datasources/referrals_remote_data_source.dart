import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/referral_code_model.dart';
import '../models/referral_model.dart';
import '../models/referral_reward_model.dart';

abstract class ReferralsRemoteDataSource {
  Future<Either<Failure, List<ReferralCodeModel>>> getMyReferralCodes();
  Future<Either<Failure, Map<String, dynamic>>> generateReferralCode(
      int merchantId);
  Future<Either<Failure, List<ReferralModel>>> getMyReferrals();
  Future<Either<Failure, List<ReferralRewardModel>>> getMyReferralRewards();
  Future<Either<Failure, Map<String, dynamic>>> acceptReferral(String code);
}

@LazySingleton(as: ReferralsRemoteDataSource)
class ReferralsRemoteDataSourceImpl implements ReferralsRemoteDataSource {
  final ApiClient _apiClient;

  const ReferralsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, List<ReferralCodeModel>>>
      getMyReferralCodes() async {
    final result = await _apiClient.get(ApiConstants.myReferralCodes);
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => ReferralCodeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> generateReferralCode(
      int merchantId) async {
    final result =
        await _apiClient.post(ApiConstants.generateReferralCode(merchantId));
    return result.map((json) => json);
  }

  @override
  Future<Either<Failure, List<ReferralModel>>> getMyReferrals() async {
    final result = await _apiClient.get(ApiConstants.myReferrals);
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => ReferralModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, List<ReferralRewardModel>>>
      getMyReferralRewards() async {
    final result = await _apiClient.get(ApiConstants.myReferralRewards);
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map(
              (e) => ReferralRewardModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> acceptReferral(
      String code) async {
    final result = await _apiClient.post(
      ApiConstants.acceptReferral,
      data: {'code': code},
    );
    return result.map((json) => json);
  }
}
