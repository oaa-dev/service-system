import 'package:equatable/equatable.dart';
import '../../domain/entities/favorite_entity.dart';

sealed class FavoritesState extends Equatable {
  const FavoritesState();

  @override
  List<Object?> get props => [];
}

class FavoritesInitial extends FavoritesState {
  const FavoritesInitial();
}

class FavoritesLoading extends FavoritesState {
  const FavoritesLoading();
}

class FavoritesLoaded extends FavoritesState {
  final List<FavoriteMerchantEntity> favorites;
  final Map<int, bool> toggledMerchants;

  const FavoritesLoaded({
    required this.favorites,
    this.toggledMerchants = const {},
  });

  FavoritesLoaded copyWith({
    List<FavoriteMerchantEntity>? favorites,
    Map<int, bool>? toggledMerchants,
  }) {
    return FavoritesLoaded(
      favorites: favorites ?? this.favorites,
      toggledMerchants: toggledMerchants ?? this.toggledMerchants,
    );
  }

  @override
  List<Object?> get props => [favorites, toggledMerchants];
}

class FavoritesError extends FavoritesState {
  final String message;

  const FavoritesError(this.message);

  @override
  List<Object?> get props => [message];
}
