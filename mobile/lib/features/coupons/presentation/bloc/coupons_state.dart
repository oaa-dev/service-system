import 'package:equatable/equatable.dart';
import '../../domain/entities/coupon_entity.dart';

sealed class CouponsState extends Equatable {
  const CouponsState();
  @override
  List<Object?> get props => [];
}

class CouponsInitial extends CouponsState {
  const CouponsInitial();
}

class CouponsLoading extends CouponsState {
  const CouponsLoading();
}

class CouponsLoaded extends CouponsState {
  final List<CouponEntity> coupons;

  const CouponsLoaded({required this.coupons});

  CouponsLoaded copyWith({List<CouponEntity>? coupons}) {
    return CouponsLoaded(coupons: coupons ?? this.coupons);
  }

  @override
  List<Object?> get props => [coupons];
}

class CouponClaiming extends CouponsState {
  final List<CouponEntity> coupons;
  final int claimingId;

  const CouponClaiming({required this.coupons, required this.claimingId});

  @override
  List<Object?> get props => [coupons, claimingId];
}

class CouponClaimSuccess extends CouponsState {
  final List<CouponEntity> coupons;
  final String message;

  const CouponClaimSuccess({required this.coupons, required this.message});

  @override
  List<Object?> get props => [coupons, message];
}

class CouponsError extends CouponsState {
  final String message;
  const CouponsError(this.message);
  @override
  List<Object?> get props => [message];
}
