import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/coupon_entity.dart';
import '../../domain/repositories/coupons_repository.dart';
import '../datasources/coupons_remote_data_source.dart';
import '../models/coupon_model.dart';

@LazySingleton(as: CouponsRepository)
class CouponsRepositoryImpl implements CouponsRepository {
  final CouponsRemoteDataSource _remote;

  const CouponsRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<CouponEntity>>> getMerchantCoupons(
      String slug) async {
    final result = await _remote.getMerchantCoupons(slug);
    return result.map((models) => models.map(_toEntity).toList());
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> claimCoupon(int id) async {
    return _remote.claimCoupon(id);
  }

  @override
  Future<Either<Failure, List<CouponEntity>>> getMyCoupons() async {
    final result = await _remote.getMyCoupons();
    return result.map((models) => models.map(_toEntity).toList());
  }

  CouponEntity _toEntity(CouponModel model) => CouponEntity(
        id: model.id,
        code: model.code,
        name: model.name,
        description: model.description,
        discountType: model.discountType,
        discountValue: model.discountValue,
        minPurchaseAmount: model.minPurchaseAmount,
        maxUses: model.maxUses,
        currentUses: model.currentUses,
        startsAt: model.startsAt,
        expiresAt: model.expiresAt,
        merchantName: model.merchantName,
        merchantSlug: model.merchantSlug,
        isClaimed: model.isClaimed ?? false,
      );
}
