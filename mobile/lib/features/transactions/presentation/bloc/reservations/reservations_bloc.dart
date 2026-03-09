import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/usecases/get_my_reservations_use_case.dart';
import '../../../domain/usecases/cancel_reservation_use_case.dart';
import 'reservations_event.dart';
import 'reservations_state.dart';

@injectable
class ReservationsBloc extends Bloc<ReservationsEvent, ReservationsState> {
  final GetMyReservationsUseCase _getMyReservations;
  final CancelReservationUseCase _cancelReservation;

  String? _currentFilter;

  ReservationsBloc(this._getMyReservations, this._cancelReservation)
      : super(const ReservationsInitial()) {
    on<LoadReservationsEvent>(_onLoad);
    on<LoadMoreReservationsEvent>(_onLoadMore);
    on<CancelReservationEvent>(_onCancel);
    on<RefreshReservationsEvent>(_onRefresh);
  }

  Future<void> _onLoad(
      LoadReservationsEvent event, Emitter<ReservationsState> emit) async {
    emit(const ReservationsLoading());
    _currentFilter = event.statusFilter;
    final result =
        await _getMyReservations(page: 1, status: _currentFilter);
    result.fold(
      (failure) => emit(ReservationsError(failure.message)),
      (reservations) => emit(ReservationsLoaded(
        reservations: reservations,
        activeFilter: _currentFilter,
        hasMore: reservations.length >= 15,
        currentPage: 1,
      )),
    );
  }

  Future<void> _onLoadMore(
      LoadMoreReservationsEvent event, Emitter<ReservationsState> emit) async {
    final current = state;
    if (current is! ReservationsLoaded || !current.hasMore) return;

    final nextPage = current.currentPage + 1;
    final result =
        await _getMyReservations(page: nextPage, status: _currentFilter);
    result.fold(
      (failure) => emit(ReservationsError(failure.message)),
      (newReservations) => emit(current.copyWith(
        reservations: [...current.reservations, ...newReservations],
        hasMore: newReservations.length >= 15,
        currentPage: nextPage,
      )),
    );
  }

  Future<void> _onCancel(
      CancelReservationEvent event, Emitter<ReservationsState> emit) async {
    final current = state;
    if (current is! ReservationsLoaded) return;

    emit(ReservationCancelling(
        reservations: current.reservations,
        cancellingId: event.reservationId));
    final result = await _cancelReservation(event.reservationId);
    result.fold(
      (failure) => emit(ReservationsError(failure.message)),
      (updated) {
        final updatedList = current.reservations
            .map((r) => r.id == updated.id ? updated : r)
            .toList();
        emit(current.copyWith(reservations: updatedList));
      },
    );
  }

  Future<void> _onRefresh(
      RefreshReservationsEvent event, Emitter<ReservationsState> emit) async {
    final result =
        await _getMyReservations(page: 1, status: _currentFilter);
    result.fold(
      (failure) => emit(ReservationsError(failure.message)),
      (reservations) => emit(ReservationsLoaded(
        reservations: reservations,
        activeFilter: _currentFilter,
        hasMore: reservations.length >= 15,
        currentPage: 1,
      )),
    );
  }
}
