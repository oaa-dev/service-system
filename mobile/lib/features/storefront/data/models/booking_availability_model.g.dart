// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'booking_availability_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookingAvailabilityModel _$BookingAvailabilityModelFromJson(
  Map<String, dynamic> json,
) => BookingAvailabilityModel(
  date: json['date'] as String,
  hasSlots: json['has_slots'] as bool,
  slots: (json['slots'] as List<dynamic>)
      .map((e) => BookingSlotModel.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$BookingAvailabilityModelToJson(
  BookingAvailabilityModel instance,
) => <String, dynamic>{
  'date': instance.date,
  'has_slots': instance.hasSlots,
  'slots': instance.slots,
};

BookingSlotModel _$BookingSlotModelFromJson(Map<String, dynamic> json) =>
    BookingSlotModel(
      slotId: (json['slot_id'] as num?)?.toInt(),
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String?,
      booked: (json['booked'] as num).toInt(),
      available: (json['available'] as num?)?.toInt(),
      maxCapacity: (json['max_capacity'] as num?)?.toInt(),
      isFull: json['is_full'] as bool,
    );

Map<String, dynamic> _$BookingSlotModelToJson(BookingSlotModel instance) =>
    <String, dynamic>{
      'slot_id': instance.slotId,
      'start_time': instance.startTime,
      'end_time': instance.endTime,
      'booked': instance.booked,
      'available': instance.available,
      'max_capacity': instance.maxCapacity,
      'is_full': instance.isFull,
    };
