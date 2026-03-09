import 'package:equatable/equatable.dart';

class BookingAvailabilityEntity extends Equatable {
  final String date;
  final bool hasSlots;
  final List<BookingSlotEntity> slots;

  const BookingAvailabilityEntity({
    required this.date,
    required this.hasSlots,
    required this.slots,
  });

  @override
  List<Object?> get props => [date, hasSlots, slots];
}

class BookingSlotEntity extends Equatable {
  final int? slotId;
  final String startTime;
  final String? endTime;
  final int booked;
  final int? available;
  final int? maxCapacity;
  final bool isFull;

  const BookingSlotEntity({
    this.slotId,
    required this.startTime,
    this.endTime,
    required this.booked,
    this.available,
    this.maxCapacity,
    required this.isFull,
  });

  @override
  List<Object?> get props =>
      [slotId, startTime, endTime, booked, available, maxCapacity, isFull];
}
