import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../domain/entities/coupon_entity.dart';
import '../../domain/usecases/get_my_coupons_use_case.dart';
import '../../domain/usecases/claim_coupon_use_case.dart';
import 'coupons_event.dart';
import 'coupons_state.dart';

@injectable
class CouponsBloc extends Bloc<CouponsEvent, CouponsState> {
  final GetMyCouponsUseCase _getMyCoupons;
  final ClaimCouponUseCase _claimCoupon;

  CouponsBloc(this._getMyCoupons, this._claimCoupon)
      : super(const CouponsInitial()) {
    on<LoadMyCouponsEvent>(_onLoad);
    on<ClaimCouponEvent>(_onClaim);
    on<RefreshCouponsEvent>(_onRefresh);
  }

  Future<void> _onLoad(
      LoadMyCouponsEvent event, Emitter<CouponsState> emit) async {
    emit(const CouponsLoading());
    final result = await _getMyCoupons();
    result.fold(
      (failure) => emit(CouponsError(failure.message)),
      (coupons) => emit(CouponsLoaded(coupons: coupons)),
    );
  }

  Future<void> _onClaim(
      ClaimCouponEvent event, Emitter<CouponsState> emit) async {
    final current = state;
    final currentCoupons = switch (current) {
      CouponsLoaded s => s.coupons,
      CouponClaimSuccess s => s.coupons,
      _ => <CouponEntity>[],
    };

    emit(CouponClaiming(coupons: currentCoupons, claimingId: event.couponId));
    final result = await _claimCoupon(event.couponId);
    result.fold(
      (failure) => emit(CouponsError(failure.message)),
      (response) {
        final message =
            response['message'] as String? ?? 'Coupon claimed successfully!';
        // Mark the coupon as claimed in the local list
        final updatedCoupons = currentCoupons.map((c) {
          if (c.id == event.couponId) {
            return CouponEntity(
              id: c.id,
              code: c.code,
              name: c.name,
              description: c.description,
              discountType: c.discountType,
              discountValue: c.discountValue,
              minPurchaseAmount: c.minPurchaseAmount,
              maxUses: c.maxUses,
              currentUses: c.currentUses,
              startsAt: c.startsAt,
              expiresAt: c.expiresAt,
              merchantName: c.merchantName,
              merchantSlug: c.merchantSlug,
              isClaimed: true,
            );
          }
          return c;
        }).toList();
        emit(CouponClaimSuccess(coupons: updatedCoupons, message: message));
      },
    );
  }

  Future<void> _onRefresh(
      RefreshCouponsEvent event, Emitter<CouponsState> emit) async {
    final result = await _getMyCoupons();
    result.fold(
      (failure) => emit(CouponsError(failure.message)),
      (coupons) => emit(CouponsLoaded(coupons: coupons)),
    );
  }
}
