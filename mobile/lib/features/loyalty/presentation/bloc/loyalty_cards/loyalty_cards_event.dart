import 'package:equatable/equatable.dart';

sealed class LoyaltyCardsEvent extends Equatable {
  const LoyaltyCardsEvent();
  @override
  List<Object?> get props => [];
}

class LoadLoyaltyCardsEvent extends LoyaltyCardsEvent {
  const LoadLoyaltyCardsEvent();
}

class LoadLoyaltyCardDetailEvent extends LoyaltyCardsEvent {
  final int id;
  const LoadLoyaltyCardDetailEvent(this.id);
  @override
  List<Object?> get props => [id];
}

class LoadMyRewardsEvent extends LoyaltyCardsEvent {
  const LoadMyRewardsEvent();
}

class RefreshLoyaltyCardsEvent extends LoyaltyCardsEvent {
  const RefreshLoyaltyCardsEvent();
}
