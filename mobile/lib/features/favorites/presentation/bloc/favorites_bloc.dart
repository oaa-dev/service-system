import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/usecases/get_my_favorites_use_case.dart';
import '../../domain/usecases/toggle_favorite_use_case.dart';
import 'favorites_event.dart';
import 'favorites_state.dart';

@injectable
class FavoritesBloc extends Bloc<FavoritesEvent, FavoritesState> {
  final GetMyFavoritesUseCase _getMyFavorites;
  final ToggleFavoriteUseCase _toggleFavorite;

  FavoritesBloc(
    this._getMyFavorites,
    this._toggleFavorite,
  ) : super(const FavoritesInitial()) {
    on<LoadFavoritesEvent>(_onLoadFavorites);
    on<ToggleFavoriteEvent>(_onToggleFavorite);
  }

  Future<void> _onLoadFavorites(
    LoadFavoritesEvent event,
    Emitter<FavoritesState> emit,
  ) async {
    emit(const FavoritesLoading());
    final result = await _getMyFavorites();
    result.fold(
      (failure) {
        if (failure is AuthFailure) {
          emit(const FavoritesError('Please log in to view your favorites.'));
        } else {
          emit(FavoritesError(failure.message));
        }
      },
      (favorites) => emit(FavoritesLoaded(favorites: favorites)),
    );
  }

  Future<void> _onToggleFavorite(
    ToggleFavoriteEvent event,
    Emitter<FavoritesState> emit,
  ) async {
    final currentState = state;
    if (currentState is! FavoritesLoaded) return;

    // Optimistic update — flip the current state
    final optimisticMap = Map<int, bool>.from(currentState.toggledMerchants);
    optimisticMap[event.merchantId] = !event.currentState;
    emit(currentState.copyWith(toggledMerchants: optimisticMap));

    final result = await _toggleFavorite(event.merchantId);
    result.fold(
      (failure) {
        // Revert optimistic update on error
        final revertedMap = Map<int, bool>.from(optimisticMap);
        revertedMap[event.merchantId] = event.currentState;
        emit(currentState.copyWith(toggledMerchants: revertedMap));

        if (failure is AuthFailure) {
          // Emit a transient error state then restore — caller can listen for errors
          emit(const FavoritesError('Please log in to save favorites.'));
          // Restore loaded state after surfacing the error
          emit(currentState.copyWith(toggledMerchants: revertedMap));
        }
      },
      (isFavorited) {
        // Confirm the server response
        final confirmedMap = Map<int, bool>.from(optimisticMap);
        confirmedMap[event.merchantId] = isFavorited;
        emit(currentState.copyWith(toggledMerchants: confirmedMap));
      },
    );
  }
}
