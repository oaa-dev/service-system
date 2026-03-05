// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'business_hours_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BusinessHoursModel _$BusinessHoursModelFromJson(Map<String, dynamic> json) =>
    BusinessHoursModel(
      dayOfWeek: (json['day_of_week'] as num).toInt(),
      isClosed: json['is_closed'] as bool? ?? false,
      openTime: json['open_time'] as String?,
      closeTime: json['close_time'] as String?,
    );

Map<String, dynamic> _$BusinessHoursModelToJson(BusinessHoursModel instance) =>
    <String, dynamic>{
      'day_of_week': instance.dayOfWeek,
      'is_closed': instance.isClosed,
      'open_time': instance.openTime,
      'close_time': instance.closeTime,
    };
