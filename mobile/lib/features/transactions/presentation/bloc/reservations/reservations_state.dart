import 'package:equatable/equatable.dart';
import '../../../domain/entities/reservation_entity.dart';

sealed class ReservationsState extends Equatable {
  const ReservationsState();
  @override
  List<Object?> get props => [];
}

class ReservationsInitial extends ReservationsState {
  const ReservationsInitial();
}

class ReservationsLoading extends ReservationsState {
  const ReservationsLoading();
}

class ReservationsLoaded extends ReservationsState {
  final List<ReservationEntity> reservations;
  final String? activeFilter;
  final bool hasMore;
  final int currentPage;

  const ReservationsLoaded({
    required this.reservations,
    this.activeFilter,
    this.hasMore = true,
    this.currentPage = 1,
  });

  ReservationsLoaded copyWith({
    List<ReservationEntity>? reservations,
    String? activeFilter,
    bool? hasMore,
    int? currentPage,
  }) {
    return ReservationsLoaded(
      reservations: reservations ?? this.reservations,
      activeFilter: activeFilter,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props =>
      [reservations, activeFilter, hasMore, currentPage];
}

class ReservationCancelling extends ReservationsState {
  final List<ReservationEntity> reservations;
  final int cancellingId;
  const ReservationCancelling(
      {required this.reservations, required this.cancellingId});
  @override
  List<Object?> get props => [reservations, cancellingId];
}

class ReservationsError extends ReservationsState {
  final String message;
  const ReservationsError(this.message);
  @override
  List<Object?> get props => [message];
}
