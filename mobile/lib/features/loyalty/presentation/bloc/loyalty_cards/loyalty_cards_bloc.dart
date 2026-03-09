import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_my_loyalty_cards_use_case.dart';
import '../../../domain/usecases/get_loyalty_card_detail_use_case.dart';
import '../../../domain/usecases/get_my_rewards_use_case.dart';
import 'loyalty_cards_event.dart';
import 'loyalty_cards_state.dart';

@injectable
class LoyaltyCardsBloc extends Bloc<LoyaltyCardsEvent, LoyaltyCardsState> {
  final GetMyLoyaltyCardsUseCase _getMyCards;
  final GetLoyaltyCardDetailUseCase _getCardDetail;
  final GetMyRewardsUseCase _getMyRewards;

  LoyaltyCardsBloc(
    this._getMyCards,
    this._getCardDetail,
    this._getMyRewards,
  ) : super(const LoyaltyCardsInitial()) {
    on<LoadLoyaltyCardsEvent>(_onLoadCards);
    on<LoadLoyaltyCardDetailEvent>(_onLoadCardDetail);
    on<LoadMyRewardsEvent>(_onLoadRewards);
    on<RefreshLoyaltyCardsEvent>(_onRefresh);
  }

  Future<void> _onLoadCards(
      LoadLoyaltyCardsEvent event, Emitter<LoyaltyCardsState> emit) async {
    emit(const LoyaltyCardsLoading());
    final result = await _getMyCards();
    result.fold(
      (failure) => emit(LoyaltyCardsError(failure.message)),
      (cards) => emit(LoyaltyCardsLoaded(cards: cards)),
    );
  }

  Future<void> _onLoadCardDetail(
      LoadLoyaltyCardDetailEvent event, Emitter<LoyaltyCardsState> emit) async {
    final current = state;
    if (current is! LoyaltyCardsLoaded) return;

    final result = await _getCardDetail(event.id);
    result.fold(
      (failure) => emit(LoyaltyCardsError(failure.message)),
      (card) => emit(current.copyWith(selectedCard: card)),
    );
  }

  Future<void> _onLoadRewards(
      LoadMyRewardsEvent event, Emitter<LoyaltyCardsState> emit) async {
    final current = state;
    if (current is! LoyaltyCardsLoaded) {
      emit(const LoyaltyCardsLoading());
      final cardsResult = await _getMyCards();
      final rewardsResult = await _getMyRewards();
      cardsResult.fold(
        (failure) => emit(LoyaltyCardsError(failure.message)),
        (cards) {
          rewardsResult.fold(
            (failure) => emit(LoyaltyCardsError(failure.message)),
            (rewards) => emit(LoyaltyCardsLoaded(cards: cards, rewards: rewards)),
          );
        },
      );
      return;
    }

    final result = await _getMyRewards();
    result.fold(
      (failure) => emit(LoyaltyCardsError(failure.message)),
      (rewards) => emit(current.copyWith(rewards: rewards)),
    );
  }

  Future<void> _onRefresh(
      RefreshLoyaltyCardsEvent event, Emitter<LoyaltyCardsState> emit) async {
    final result = await _getMyCards();
    result.fold(
      (failure) => emit(LoyaltyCardsError(failure.message)),
      (cards) {
        final current = state;
        final rewards = current is LoyaltyCardsLoaded ? current.rewards : null;
        emit(LoyaltyCardsLoaded(cards: cards, rewards: rewards));
      },
    );
  }
}
