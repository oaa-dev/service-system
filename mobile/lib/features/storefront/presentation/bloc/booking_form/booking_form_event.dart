import 'package:equatable/equatable.dart';
import '../../../domain/entities/booking_availability_entity.dart';
import '../../../domain/entities/service_entity.dart';

sealed class BookingFormEvent extends Equatable {
  const BookingFormEvent();

  @override
  List<Object?> get props => [];
}

class InitBookingFormEvent extends BookingFormEvent {
  final List<ServiceEntity> services;
  final String merchantSlug;
  final int? preselectedServiceId;

  const InitBookingFormEvent({
    required this.services,
    required this.merchantSlug,
    this.preselectedServiceId,
  });

  @override
  List<Object?> get props => [services, merchantSlug, preselectedServiceId];
}

class SelectServiceEvent extends BookingFormEvent {
  final ServiceEntity service;

  const SelectServiceEvent(this.service);

  @override
  List<Object?> get props => [service];
}

class SelectDateEvent extends BookingFormEvent {
  final DateTime date;

  const SelectDateEvent(this.date);

  @override
  List<Object?> get props => [date];
}

class SelectSlotEvent extends BookingFormEvent {
  final BookingSlotEntity slot;

  const SelectSlotEvent(this.slot);

  @override
  List<Object?> get props => [slot];
}

class SetCustomTimeEvent extends BookingFormEvent {
  final String startTime;

  const SetCustomTimeEvent(this.startTime);

  @override
  List<Object?> get props => [startTime];
}

class SetPartySizeEvent extends BookingFormEvent {
  final int partySize;

  const SetPartySizeEvent(this.partySize);

  @override
  List<Object?> get props => [partySize];
}

class SetNotesEvent extends BookingFormEvent {
  final String notes;

  const SetNotesEvent(this.notes);

  @override
  List<Object?> get props => [notes];
}

class SubmitBookingEvent extends BookingFormEvent {
  const SubmitBookingEvent();
}

class GoBackStepEvent extends BookingFormEvent {
  const GoBackStepEvent();
}

class GoToConfirmStepEvent extends BookingFormEvent {
  const GoToConfirmStepEvent();
}

class ResetBookingFormEvent extends BookingFormEvent {
  const ResetBookingFormEvent();
}
