import 'package:equatable/equatable.dart';

sealed class CouponsEvent extends Equatable {
  const CouponsEvent();
  @override
  List<Object?> get props => [];
}

class LoadMyCouponsEvent extends CouponsEvent {
  const LoadMyCouponsEvent();
}

class ClaimCouponEvent extends CouponsEvent {
  final int couponId;
  const ClaimCouponEvent(this.couponId);
  @override
  List<Object?> get props => [couponId];
}

class RefreshCouponsEvent extends CouponsEvent {
  const RefreshCouponsEvent();
}
