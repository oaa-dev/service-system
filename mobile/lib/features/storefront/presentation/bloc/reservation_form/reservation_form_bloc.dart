import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/entities/service_entity.dart';
import '../../../domain/usecases/create_reservation_use_case.dart';
import 'reservation_form_event.dart';
import 'reservation_form_state.dart';

@injectable
class ReservationFormBloc
    extends Bloc<ReservationFormEvent, ReservationFormState> {
  final CreateReservationUseCase _createReservation;

  ReservationFormBloc(this._createReservation)
      : super(const ReservationFormState()) {
    on<InitReservationFormEvent>(_onInit);
    on<SelectReservationServiceEvent>(_onSelectService);
    on<SelectCheckInEvent>(_onSelectCheckIn);
    on<SelectCheckOutEvent>(_onSelectCheckOut);
    on<SetGuestCountEvent>(_onSetGuestCount);
    on<SetReservationNotesEvent>(_onSetNotes);
    on<SetSpecialRequestsEvent>(_onSetSpecialRequests);
    on<SubmitReservationEvent>(_onSubmit);
    on<GoBackReservationStepEvent>(_onGoBack);
    on<ResetReservationFormEvent>(_onReset);
  }

  Future<void> _onInit(
    InitReservationFormEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    ServiceEntity? preselected;
    if (event.preselectedServiceId != null) {
      preselected = event.services.where((s) => s.id == event.preselectedServiceId).firstOrNull;
    }
    emit(ReservationFormState(
      step: preselected != null ? 2 : 1,
      services: event.services,
      merchantSlug: event.merchantSlug,
      selectedService: preselected,
    ));
  }

  Future<void> _onSelectService(
    SelectReservationServiceEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    emit(state.copyWith(
      selectedService: event.service,
      step: 2,
      clearError: true,
    ));
  }

  Future<void> _onSelectCheckIn(
    SelectCheckInEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    final shouldClearCheckOut =
        state.checkOut != null && !state.checkOut!.isAfter(event.date);

    emit(state.copyWith(
      checkIn: event.date,
      clearCheckOut: shouldClearCheckOut,
      clearError: true,
    ));

    // Auto-advance to step 3 when both dates are set
    if (!shouldClearCheckOut && state.checkOut != null) {
      emit(state.copyWith(step: 3));
    }
  }

  Future<void> _onSelectCheckOut(
    SelectCheckOutEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    if (state.checkIn == null || !event.date.isAfter(state.checkIn!)) {
      return;
    }

    emit(state.copyWith(
      checkOut: event.date,
      step: 3,
      clearError: true,
    ));
  }

  Future<void> _onSetGuestCount(
    SetGuestCountEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    emit(state.copyWith(guestCount: event.count));
  }

  Future<void> _onSetNotes(
    SetReservationNotesEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    emit(state.copyWith(notes: event.notes));
  }

  Future<void> _onSetSpecialRequests(
    SetSpecialRequestsEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    emit(state.copyWith(specialRequests: event.requests));
  }

  Future<void> _onSubmit(
    SubmitReservationEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    emit(state.copyWith(
      isSubmitting: true,
      clearError: true,
    ));

    final data = <String, dynamic>{
      'service_id': state.selectedService!.id,
      'check_in': _formatDate(state.checkIn!),
      'check_out': _formatDate(state.checkOut!),
      'guest_count': state.guestCount,
      if (state.notes.isNotEmpty) 'notes': state.notes,
      if (state.specialRequests.isNotEmpty)
        'special_requests': state.specialRequests,
    };

    final result = await _createReservation(
      slug: state.merchantSlug,
      data: data,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        isSubmitting: false,
        error: failure.message,
      )),
      (reservation) => emit(state.copyWith(
        isSubmitting: false,
        isSuccess: true,
        createdReservation: reservation,
      )),
    );
  }

  Future<void> _onGoBack(
    GoBackReservationStepEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    if (state.step > 1) {
      emit(state.copyWith(
        step: state.step - 1,
        clearError: true,
      ));
    }
  }

  Future<void> _onReset(
    ResetReservationFormEvent event,
    Emitter<ReservationFormState> emit,
  ) async {
    emit(ReservationFormState(
      step: 1,
      services: state.services,
      merchantSlug: state.merchantSlug,
    ));
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
