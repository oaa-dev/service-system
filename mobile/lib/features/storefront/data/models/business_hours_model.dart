import 'package:json_annotation/json_annotation.dart';

part 'business_hours_model.g.dart';

@JsonSerializable()
class BusinessHoursModel {
  @JsonKey(name: 'day_of_week')
  final int dayOfWeek;
  @JsonKey(name: 'is_closed')
  final bool isClosed;
  @JsonKey(name: 'open_time')
  final String? openTime;
  @JsonKey(name: 'close_time')
  final String? closeTime;

  const BusinessHoursModel({
    required this.dayOfWeek,
    this.isClosed = false,
    this.openTime,
    this.closeTime,
  });

  bool get isOpen => !isClosed;

  factory BusinessHoursModel.fromJson(Map<String, dynamic> json) =>
      _$BusinessHoursModelFromJson(json);

  Map<String, dynamic> toJson() => _$BusinessHoursModelToJson(this);
}
