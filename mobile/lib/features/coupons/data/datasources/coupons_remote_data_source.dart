import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_client.dart';
import '../models/coupon_model.dart';

abstract class CouponsRemoteDataSource {
  Future<Either<Failure, List<CouponModel>>> getMerchantCoupons(String slug);
  Future<Either<Failure, Map<String, dynamic>>> claimCoupon(int id);
  Future<Either<Failure, List<CouponModel>>> getMyCoupons();
}

@LazySingleton(as: CouponsRemoteDataSource)
class CouponsRemoteDataSourceImpl implements CouponsRemoteDataSource {
  final ApiClient _apiClient;

  const CouponsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Either<Failure, List<CouponModel>>> getMerchantCoupons(
      String slug) async {
    final result = await _apiClient.get(ApiConstants.merchantCoupons(slug));
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => CouponModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> claimCoupon(int id) async {
    final result = await _apiClient.post(ApiConstants.claimCoupon(id));
    return result.map((json) => json);
  }

  @override
  Future<Either<Failure, List<CouponModel>>> getMyCoupons() async {
    final result = await _apiClient.get(ApiConstants.myClaimedCoupons);
    return result.map((json) {
      final dataList = json['data'] as List;
      return dataList
          .map((e) => CouponModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }
}
