import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/coupon_entity.dart';
import '../repositories/coupons_repository.dart';

@lazySingleton
class GetMyCouponsUseCase {
  final CouponsRepository _repository;

  const GetMyCouponsUseCase(this._repository);

  Future<Either<Failure, List<CouponEntity>>> call() {
    return _repository.getMyCoupons();
  }
}
