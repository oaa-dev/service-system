import 'package:json_annotation/json_annotation.dart';

part 'booking_availability_model.g.dart';

@JsonSerializable()
class BookingAvailabilityModel {
  final String date;
  @JsonKey(name: 'has_slots')
  final bool hasSlots;
  final List<BookingSlotModel> slots;

  const BookingAvailabilityModel({
    required this.date,
    required this.hasSlots,
    required this.slots,
  });

  factory BookingAvailabilityModel.fromJson(Map<String, dynamic> json) =>
      _$BookingAvailabilityModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingAvailabilityModelToJson(this);
}

@JsonSerializable()
class BookingSlotModel {
  @JsonKey(name: 'slot_id')
  final int? slotId;
  @JsonKey(name: 'start_time')
  final String startTime;
  @JsonKey(name: 'end_time')
  final String? endTime;
  final int booked;
  final int? available;
  @JsonKey(name: 'max_capacity')
  final int? maxCapacity;
  @JsonKey(name: 'is_full')
  final bool isFull;

  const BookingSlotModel({
    this.slotId,
    required this.startTime,
    this.endTime,
    required this.booked,
    this.available,
    this.maxCapacity,
    required this.isFull,
  });

  factory BookingSlotModel.fromJson(Map<String, dynamic> json) =>
      _$BookingSlotModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingSlotModelToJson(this);
}
