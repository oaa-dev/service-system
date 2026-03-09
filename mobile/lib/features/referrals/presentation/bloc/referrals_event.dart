import 'package:equatable/equatable.dart';

sealed class ReferralsEvent extends Equatable {
  const ReferralsEvent();
  @override
  List<Object?> get props => [];
}

class LoadMyReferralCodesEvent extends ReferralsEvent {
  const LoadMyReferralCodesEvent();
}

class LoadMyReferralsEvent extends ReferralsEvent {
  const LoadMyReferralsEvent();
}

class LoadMyReferralRewardsEvent extends ReferralsEvent {
  const LoadMyReferralRewardsEvent();
}

class LoadAllReferralDataEvent extends ReferralsEvent {
  const LoadAllReferralDataEvent();
}

class AcceptReferralEvent extends ReferralsEvent {
  final String code;
  const AcceptReferralEvent(this.code);
  @override
  List<Object?> get props => [code];
}

class RefreshReferralsEvent extends ReferralsEvent {
  const RefreshReferralsEvent();
}
