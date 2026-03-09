import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/coupons_repository.dart';

@lazySingleton
class ClaimCouponUseCase {
  final CouponsRepository _repository;

  const ClaimCouponUseCase(this._repository);

  Future<Either<Failure, Map<String, dynamic>>> call(int id) {
    return _repository.claimCoupon(id);
  }
}
