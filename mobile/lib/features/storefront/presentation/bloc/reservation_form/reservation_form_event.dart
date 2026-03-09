import 'package:equatable/equatable.dart';
import '../../../domain/entities/service_entity.dart';

sealed class ReservationFormEvent extends Equatable {
  const ReservationFormEvent();

  @override
  List<Object?> get props => [];
}

class InitReservationFormEvent extends ReservationFormEvent {
  final List<ServiceEntity> services;
  final String merchantSlug;
  final int? preselectedServiceId;

  const InitReservationFormEvent({
    required this.services,
    required this.merchantSlug,
    this.preselectedServiceId,
  });

  @override
  List<Object?> get props => [services, merchantSlug, preselectedServiceId];
}

class SelectReservationServiceEvent extends ReservationFormEvent {
  final ServiceEntity service;

  const SelectReservationServiceEvent(this.service);

  @override
  List<Object?> get props => [service];
}

class SelectCheckInEvent extends ReservationFormEvent {
  final DateTime date;

  const SelectCheckInEvent(this.date);

  @override
  List<Object?> get props => [date];
}

class SelectCheckOutEvent extends ReservationFormEvent {
  final DateTime date;

  const SelectCheckOutEvent(this.date);

  @override
  List<Object?> get props => [date];
}

class SetGuestCountEvent extends ReservationFormEvent {
  final int count;

  const SetGuestCountEvent(this.count);

  @override
  List<Object?> get props => [count];
}

class SetReservationNotesEvent extends ReservationFormEvent {
  final String notes;

  const SetReservationNotesEvent(this.notes);

  @override
  List<Object?> get props => [notes];
}

class SetSpecialRequestsEvent extends ReservationFormEvent {
  final String requests;

  const SetSpecialRequestsEvent(this.requests);

  @override
  List<Object?> get props => [requests];
}

class SubmitReservationEvent extends ReservationFormEvent {
  const SubmitReservationEvent();
}

class GoBackReservationStepEvent extends ReservationFormEvent {
  const GoBackReservationStepEvent();
}

class ResetReservationFormEvent extends ReservationFormEvent {
  const ResetReservationFormEvent();
}
