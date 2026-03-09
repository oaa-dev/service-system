import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/loyalty_card_model.dart';
import '../models/loyalty_reward_model.dart';
import '../models/scan_result_model.dart';

abstract class LoyaltyRemoteDataSource {
  Future<Either<Failure, List<LoyaltyCardModel>>> getMyCards();
  Future<Either<Failure, LoyaltyCardModel>> getCardDetail(int id);
  Future<Either<Failure, List<LoyaltyRewardModel>>> getMyRewards();
  Future<Either<Failure, ScanResultModel>> scanQrCode(String token);
}

@LazySingleton(as: LoyaltyRemoteDataSource)
class LoyaltyRemoteDataSourceImpl implements LoyaltyRemoteDataSource {
  final ApiClient _apiClient;

  const LoyaltyRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, List<LoyaltyCardModel>>> getMyCards() async {
    final result = await _apiClient.get(ApiConstants.myLoyaltyCards);
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => LoyaltyCardModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, LoyaltyCardModel>> getCardDetail(int id) async {
    final result = await _apiClient.get(ApiConstants.loyaltyCardDetail(id));
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return LoyaltyCardModel.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, List<LoyaltyRewardModel>>> getMyRewards() async {
    final result = await _apiClient.get(ApiConstants.myLoyaltyRewards);
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => LoyaltyRewardModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, ScanResultModel>> scanQrCode(String token) async {
    final result = await _apiClient.post(
      ApiConstants.loyaltyScanQr,
      data: {'token': token},
    );
    return result.map((json) {
      final data = json['data'] as Map<String, dynamic>;
      return ScanResultModel.fromJson(data);
    });
  }
}
