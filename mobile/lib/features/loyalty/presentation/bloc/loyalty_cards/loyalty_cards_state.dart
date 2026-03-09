import 'package:equatable/equatable.dart';
import '../../../domain/entities/loyalty_card_entity.dart';
import '../../../domain/entities/loyalty_reward_entity.dart';

sealed class LoyaltyCardsState extends Equatable {
  const LoyaltyCardsState();
  @override
  List<Object?> get props => [];
}

class LoyaltyCardsInitial extends LoyaltyCardsState {
  const LoyaltyCardsInitial();
}

class LoyaltyCardsLoading extends LoyaltyCardsState {
  const LoyaltyCardsLoading();
}

class LoyaltyCardsLoaded extends LoyaltyCardsState {
  final List<LoyaltyCardEntity> cards;
  final List<LoyaltyRewardEntity>? rewards;
  final LoyaltyCardEntity? selectedCard;

  const LoyaltyCardsLoaded({
    required this.cards,
    this.rewards,
    this.selectedCard,
  });

  LoyaltyCardsLoaded copyWith({
    List<LoyaltyCardEntity>? cards,
    List<LoyaltyRewardEntity>? rewards,
    LoyaltyCardEntity? selectedCard,
  }) {
    return LoyaltyCardsLoaded(
      cards: cards ?? this.cards,
      rewards: rewards ?? this.rewards,
      selectedCard: selectedCard ?? this.selectedCard,
    );
  }

  @override
  List<Object?> get props => [cards, rewards, selectedCard];
}

class LoyaltyCardsError extends LoyaltyCardsState {
  final String message;
  const LoyaltyCardsError(this.message);
  @override
  List<Object?> get props => [message];
}
