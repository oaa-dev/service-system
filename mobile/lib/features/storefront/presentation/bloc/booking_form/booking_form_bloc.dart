import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../domain/entities/service_entity.dart';
import '../../../domain/usecases/create_booking_use_case.dart';
import '../../../domain/usecases/get_booking_availability_use_case.dart';
import 'booking_form_event.dart';
import 'booking_form_state.dart';

@injectable
class BookingFormBloc extends Bloc<BookingFormEvent, BookingFormState> {
  final GetBookingAvailabilityUseCase _getAvailability;
  final CreateBookingUseCase _createBooking;

  BookingFormBloc(this._getAvailability, this._createBooking)
      : super(const BookingFormState()) {
    on<InitBookingFormEvent>(_onInit);
    on<SelectServiceEvent>(_onSelectService);
    on<SelectDateEvent>(_onSelectDate);
    on<SelectSlotEvent>(_onSelectSlot);
    on<SetCustomTimeEvent>(_onSetCustomTime);
    on<SetPartySizeEvent>(_onSetPartySize);
    on<SetNotesEvent>(_onSetNotes);
    on<SubmitBookingEvent>(_onSubmit);
    on<GoToConfirmStepEvent>(_onGoToConfirm);
    on<GoBackStepEvent>(_onGoBack);
    on<ResetBookingFormEvent>(_onReset);
  }

  Future<void> _onInit(
    InitBookingFormEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    ServiceEntity? preselected;
    if (event.preselectedServiceId != null) {
      preselected = event.services.where((s) => s.id == event.preselectedServiceId).firstOrNull;
    }
    emit(BookingFormState(
      step: preselected != null ? 2 : 1,
      services: event.services,
      merchantSlug: event.merchantSlug,
      selectedService: preselected,
    ));
  }

  Future<void> _onSelectService(
    SelectServiceEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(state.copyWith(
      selectedService: event.service,
      step: 2,
      clearError: true,
    ));
  }

  Future<void> _onSelectDate(
    SelectDateEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(state.copyWith(
      selectedDate: event.date,
      clearSelectedSlot: true,
      clearSelectedStartTime: true,
      clearAvailability: true,
      isLoadingAvailability: true,
      clearError: true,
    ));

    final dateStr = _formatDate(event.date);
    final result = await _getAvailability(
      slug: state.merchantSlug,
      serviceId: state.selectedService!.id,
      date: dateStr,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        isLoadingAvailability: false,
        error: failure.message,
      )),
      (availability) => emit(state.copyWith(
        availability: availability,
        isLoadingAvailability: false,
        step: 3,
      )),
    );
  }

  Future<void> _onSelectSlot(
    SelectSlotEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(state.copyWith(
      selectedSlot: event.slot,
      clearSelectedStartTime: true,
      clearError: true,
    ));
  }

  Future<void> _onSetCustomTime(
    SetCustomTimeEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(state.copyWith(
      selectedStartTime: event.startTime,
      clearSelectedSlot: true,
      clearError: true,
    ));
  }

  Future<void> _onSetPartySize(
    SetPartySizeEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(state.copyWith(partySize: event.partySize));
  }

  Future<void> _onSetNotes(
    SetNotesEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(state.copyWith(notes: event.notes));
  }

  Future<void> _onSubmit(
    SubmitBookingEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(state.copyWith(
      isSubmitting: true,
      clearError: true,
    ));

    final data = <String, dynamic>{
      'service_id': state.selectedService!.id,
      'booking_date': _formatDate(state.selectedDate!),
      'party_size': state.partySize,
      if (state.selectedSlot?.slotId != null)
        'booking_slot_id': state.selectedSlot!.slotId,
      if (state.selectedStartTime != null)
        'start_time': state.selectedStartTime,
      if (state.notes.isNotEmpty) 'notes': state.notes,
    };

    final result = await _createBooking(
      slug: state.merchantSlug,
      data: data,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        isSubmitting: false,
        error: failure.message,
      )),
      (booking) => emit(state.copyWith(
        isSubmitting: false,
        isSuccess: true,
        createdBooking: booking,
      )),
    );
  }

  Future<void> _onGoToConfirm(
    GoToConfirmStepEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    if (state.step == 3) {
      emit(state.copyWith(step: 4, clearError: true));
    }
  }

  Future<void> _onGoBack(
    GoBackStepEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    if (state.step > 1) {
      emit(state.copyWith(
        step: state.step - 1,
        clearError: true,
      ));
    }
  }

  Future<void> _onReset(
    ResetBookingFormEvent event,
    Emitter<BookingFormState> emit,
  ) async {
    emit(BookingFormState(
      step: 1,
      services: state.services,
      merchantSlug: state.merchantSlug,
    ));
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
