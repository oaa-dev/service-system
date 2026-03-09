import 'package:equatable/equatable.dart';

sealed class ReservationsEvent extends Equatable {
  const ReservationsEvent();
  @override
  List<Object?> get props => [];
}

class LoadReservationsEvent extends ReservationsEvent {
  final String? statusFilter;
  const LoadReservationsEvent({this.statusFilter});
  @override
  List<Object?> get props => [statusFilter];
}

class LoadMoreReservationsEvent extends ReservationsEvent {
  const LoadMoreReservationsEvent();
}

class CancelReservationEvent extends ReservationsEvent {
  final int reservationId;
  const CancelReservationEvent(this.reservationId);
  @override
  List<Object?> get props => [reservationId];
}

class RefreshReservationsEvent extends ReservationsEvent {
  const RefreshReservationsEvent();
}
