import 'package:equatable/equatable.dart';

sealed class BookingsEvent extends Equatable {
  const BookingsEvent();
  @override
  List<Object?> get props => [];
}

class LoadBookingsEvent extends BookingsEvent {
  final String? statusFilter;
  const LoadBookingsEvent({this.statusFilter});
  @override
  List<Object?> get props => [statusFilter];
}

class LoadMoreBookingsEvent extends BookingsEvent {
  const LoadMoreBookingsEvent();
}

class CancelBookingEvent extends BookingsEvent {
  final int bookingId;
  const CancelBookingEvent(this.bookingId);
  @override
  List<Object?> get props => [bookingId];
}

class RefreshBookingsEvent extends BookingsEvent {
  const RefreshBookingsEvent();
}
