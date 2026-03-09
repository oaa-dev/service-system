import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_my_bookings_use_case.dart';
import '../../../domain/usecases/cancel_booking_use_case.dart';
import 'bookings_event.dart';
import 'bookings_state.dart';

@injectable
class BookingsBloc extends Bloc<BookingsEvent, BookingsState> {
  final GetMyBookingsUseCase _getMyBookings;
  final CancelBookingUseCase _cancelBooking;

  String? _currentFilter;

  BookingsBloc(this._getMyBookings, this._cancelBooking)
      : super(const BookingsInitial()) {
    on<LoadBookingsEvent>(_onLoad);
    on<LoadMoreBookingsEvent>(_onLoadMore);
    on<CancelBookingEvent>(_onCancel);
    on<RefreshBookingsEvent>(_onRefresh);
  }

  Future<void> _onLoad(
      LoadBookingsEvent event, Emitter<BookingsState> emit) async {
    emit(const BookingsLoading());
    _currentFilter = event.statusFilter;
    final result = await _getMyBookings(page: 1, status: _currentFilter);
    result.fold(
      (failure) => emit(BookingsError(failure.message)),
      (bookings) => emit(BookingsLoaded(
        bookings: bookings,
        activeFilter: _currentFilter,
        hasMore: bookings.length >= 15,
        currentPage: 1,
      )),
    );
  }

  Future<void> _onLoadMore(
      LoadMoreBookingsEvent event, Emitter<BookingsState> emit) async {
    final current = state;
    if (current is! BookingsLoaded || !current.hasMore) return;

    final nextPage = current.currentPage + 1;
    final result = await _getMyBookings(page: nextPage, status: _currentFilter);
    result.fold(
      (failure) => emit(BookingsError(failure.message)),
      (newBookings) => emit(current.copyWith(
        bookings: [...current.bookings, ...newBookings],
        hasMore: newBookings.length >= 15,
        currentPage: nextPage,
      )),
    );
  }

  Future<void> _onCancel(
      CancelBookingEvent event, Emitter<BookingsState> emit) async {
    final current = state;
    if (current is! BookingsLoaded) return;

    emit(BookingCancelling(
        bookings: current.bookings, cancellingId: event.bookingId));
    final result = await _cancelBooking(event.bookingId);
    result.fold(
      (failure) => emit(BookingsError(failure.message)),
      (updated) {
        final updatedList = current.bookings
            .map((b) => b.id == updated.id ? updated : b)
            .toList();
        emit(current.copyWith(bookings: updatedList));
      },
    );
  }

  Future<void> _onRefresh(
      RefreshBookingsEvent event, Emitter<BookingsState> emit) async {
    final result = await _getMyBookings(page: 1, status: _currentFilter);
    result.fold(
      (failure) => emit(BookingsError(failure.message)),
      (bookings) => emit(BookingsLoaded(
        bookings: bookings,
        activeFilter: _currentFilter,
        hasMore: bookings.length >= 15,
        currentPage: 1,
      )),
    );
  }
}
