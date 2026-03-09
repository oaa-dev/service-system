import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/coupon_entity.dart';

abstract class CouponsRepository {
  Future<Either<Failure, List<CouponEntity>>> getMerchantCoupons(String slug);
  Future<Either<Failure, Map<String, dynamic>>> claimCoupon(int id);
  Future<Either<Failure, List<CouponEntity>>> getMyCoupons();
}
