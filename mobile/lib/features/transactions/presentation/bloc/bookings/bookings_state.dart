import 'package:equatable/equatable.dart';
import '../../../domain/entities/booking_entity.dart';

sealed class BookingsState extends Equatable {
  const BookingsState();
  @override
  List<Object?> get props => [];
}

class BookingsInitial extends BookingsState {
  const BookingsInitial();
}

class BookingsLoading extends BookingsState {
  const BookingsLoading();
}

class BookingsLoaded extends BookingsState {
  final List<BookingEntity> bookings;
  final String? activeFilter;
  final bool hasMore;
  final int currentPage;

  const BookingsLoaded({
    required this.bookings,
    this.activeFilter,
    this.hasMore = true,
    this.currentPage = 1,
  });

  BookingsLoaded copyWith({
    List<BookingEntity>? bookings,
    String? activeFilter,
    bool? hasMore,
    int? currentPage,
  }) {
    return BookingsLoaded(
      bookings: bookings ?? this.bookings,
      activeFilter: activeFilter,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [bookings, activeFilter, hasMore, currentPage];
}

class BookingCancelling extends BookingsState {
  final List<BookingEntity> bookings;
  final int cancellingId;
  const BookingCancelling(
      {required this.bookings, required this.cancellingId});
  @override
  List<Object?> get props => [bookings, cancellingId];
}

class BookingsError extends BookingsState {
  final String message;
  const BookingsError(this.message);
  @override
  List<Object?> get props => [message];
}
