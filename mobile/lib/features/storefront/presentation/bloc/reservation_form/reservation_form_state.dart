import 'package:equatable/equatable.dart';
import '../../../domain/entities/service_entity.dart';

class ReservationFormState extends Equatable {
  final int step;
  final List<ServiceEntity> services;
  final String merchantSlug;
  final ServiceEntity? selectedService;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final int guestCount;
  final String notes;
  final String specialRequests;
  final bool isSubmitting;
  final String? error;
  final bool isSuccess;
  final Map<String, dynamic>? createdReservation;

  const ReservationFormState({
    this.step = 1,
    this.services = const [],
    this.merchantSlug = '',
    this.selectedService,
    this.checkIn,
    this.checkOut,
    this.guestCount = 1,
    this.notes = '',
    this.specialRequests = '',
    this.isSubmitting = false,
    this.error,
    this.isSuccess = false,
    this.createdReservation,
  });

  int? get nights =>
      (checkIn != null && checkOut != null)
          ? checkOut!.difference(checkIn!).inDays
          : null;

  ReservationFormState copyWith({
    int? step,
    List<ServiceEntity>? services,
    String? merchantSlug,
    ServiceEntity? selectedService,
    DateTime? checkIn,
    DateTime? checkOut,
    int? guestCount,
    String? notes,
    String? specialRequests,
    bool? isSubmitting,
    String? error,
    bool? isSuccess,
    Map<String, dynamic>? createdReservation,
    bool clearCheckOut = false,
    bool clearError = false,
  }) {
    return ReservationFormState(
      step: step ?? this.step,
      services: services ?? this.services,
      merchantSlug: merchantSlug ?? this.merchantSlug,
      selectedService: selectedService ?? this.selectedService,
      checkIn: checkIn ?? this.checkIn,
      checkOut: clearCheckOut ? null : (checkOut ?? this.checkOut),
      guestCount: guestCount ?? this.guestCount,
      notes: notes ?? this.notes,
      specialRequests: specialRequests ?? this.specialRequests,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: clearError ? null : (error ?? this.error),
      isSuccess: isSuccess ?? this.isSuccess,
      createdReservation: createdReservation ?? this.createdReservation,
    );
  }

  @override
  List<Object?> get props => [
        step,
        services,
        merchantSlug,
        selectedService,
        checkIn,
        checkOut,
        guestCount,
        notes,
        specialRequests,
        isSubmitting,
        error,
        isSuccess,
        createdReservation,
      ];
}
