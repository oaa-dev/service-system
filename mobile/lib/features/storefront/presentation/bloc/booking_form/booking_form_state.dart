import 'package:equatable/equatable.dart';
import '../../../domain/entities/booking_availability_entity.dart';
import '../../../domain/entities/service_entity.dart';

class BookingFormState extends Equatable {
  final int step;
  final List<ServiceEntity> services;
  final String merchantSlug;
  final ServiceEntity? selectedService;
  final DateTime? selectedDate;
  final BookingSlotEntity? selectedSlot;
  final String? selectedStartTime;
  final int partySize;
  final String notes;
  final BookingAvailabilityEntity? availability;
  final bool isLoadingAvailability;
  final bool isSubmitting;
  final String? error;
  final bool isSuccess;
  final Map<String, dynamic>? createdBooking;

  const BookingFormState({
    this.step = 1,
    this.services = const [],
    this.merchantSlug = '',
    this.selectedService,
    this.selectedDate,
    this.selectedSlot,
    this.selectedStartTime,
    this.partySize = 1,
    this.notes = '',
    this.availability,
    this.isLoadingAvailability = false,
    this.isSubmitting = false,
    this.error,
    this.isSuccess = false,
    this.createdBooking,
  });

  BookingFormState copyWith({
    int? step,
    List<ServiceEntity>? services,
    String? merchantSlug,
    ServiceEntity? selectedService,
    DateTime? selectedDate,
    BookingSlotEntity? selectedSlot,
    String? selectedStartTime,
    int? partySize,
    String? notes,
    BookingAvailabilityEntity? availability,
    bool? isLoadingAvailability,
    bool? isSubmitting,
    String? error,
    bool? isSuccess,
    Map<String, dynamic>? createdBooking,
    bool clearSelectedSlot = false,
    bool clearSelectedStartTime = false,
    bool clearError = false,
    bool clearAvailability = false,
  }) {
    return BookingFormState(
      step: step ?? this.step,
      services: services ?? this.services,
      merchantSlug: merchantSlug ?? this.merchantSlug,
      selectedService: selectedService ?? this.selectedService,
      selectedDate: selectedDate ?? this.selectedDate,
      selectedSlot:
          clearSelectedSlot ? null : (selectedSlot ?? this.selectedSlot),
      selectedStartTime: clearSelectedStartTime
          ? null
          : (selectedStartTime ?? this.selectedStartTime),
      partySize: partySize ?? this.partySize,
      notes: notes ?? this.notes,
      availability:
          clearAvailability ? null : (availability ?? this.availability),
      isLoadingAvailability:
          isLoadingAvailability ?? this.isLoadingAvailability,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: clearError ? null : (error ?? this.error),
      isSuccess: isSuccess ?? this.isSuccess,
      createdBooking: createdBooking ?? this.createdBooking,
    );
  }

  @override
  List<Object?> get props => [
        step,
        services,
        merchantSlug,
        selectedService,
        selectedDate,
        selectedSlot,
        selectedStartTime,
        partySize,
        notes,
        availability,
        isLoadingAvailability,
        isSubmitting,
        error,
        isSuccess,
        createdBooking,
      ];
}
