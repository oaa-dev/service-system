import 'package:equatable/equatable.dart';

sealed class FavoritesEvent extends Equatable {
  const FavoritesEvent();

  @override
  List<Object?> get props => [];
}

class LoadFavoritesEvent extends FavoritesEvent {
  const LoadFavoritesEvent();
}

class ToggleFavoriteEvent extends FavoritesEvent {
  final int merchantId;
  final bool currentState;

  const ToggleFavoriteEvent(this.merchantId, this.currentState);

  @override
  List<Object?> get props => [merchantId, currentState];
}
