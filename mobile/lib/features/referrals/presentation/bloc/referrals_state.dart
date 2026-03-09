import 'package:equatable/equatable.dart';
import '../../domain/entities/referral_code_entity.dart';
import '../../domain/entities/referral_entity.dart';
import '../../domain/entities/referral_reward_entity.dart';

sealed class ReferralsState extends Equatable {
  const ReferralsState();
  @override
  List<Object?> get props => [];
}

class ReferralsInitial extends ReferralsState {
  const ReferralsInitial();
}

class ReferralsLoading extends ReferralsState {
  const ReferralsLoading();
}

class ReferralsLoaded extends ReferralsState {
  final List<ReferralCodeEntity> codes;
  final List<ReferralEntity> referrals;
  final List<ReferralRewardEntity> rewards;

  const ReferralsLoaded({
    required this.codes,
    required this.referrals,
    required this.rewards,
  });

  ReferralsLoaded copyWith({
    List<ReferralCodeEntity>? codes,
    List<ReferralEntity>? referrals,
    List<ReferralRewardEntity>? rewards,
  }) {
    return ReferralsLoaded(
      codes: codes ?? this.codes,
      referrals: referrals ?? this.referrals,
      rewards: rewards ?? this.rewards,
    );
  }

  @override
  List<Object?> get props => [codes, referrals, rewards];
}

class ReferralAccepting extends ReferralsState {
  const ReferralAccepting();
}

class ReferralAcceptSuccess extends ReferralsState {
  final String message;
  const ReferralAcceptSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class ReferralsError extends ReferralsState {
  final String message;
  const ReferralsError(this.message);
  @override
  List<Object?> get props => [message];
}
