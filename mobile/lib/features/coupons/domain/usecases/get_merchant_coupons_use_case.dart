import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/coupon_entity.dart';
import '../repositories/coupons_repository.dart';

@lazySingleton
class GetMerchantCouponsUseCase {
  final CouponsRepository _repository;

  const GetMerchantCouponsUseCase(this._repository);

  Future<Either<Failure, List<CouponEntity>>> call(String slug) {
    return _repository.getMerchantCoupons(slug);
  }
}
