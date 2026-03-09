import 'package:json_annotation/json_annotation.dart';

part 'scan_result_model.g.dart';

@JsonSerializable()
class ScanResultModel {
  final bool success;
  final String message;
  @JsonKey(name: 'stamps_added')
  final int? stampsAdded;
  @JsonKey(name: 'current_stamps')
  final int? currentStamps;
  @JsonKey(name: 'reward_unlocked')
  final String? rewardUnlocked;

  const ScanResultModel({
    required this.success,
    required this.message,
    this.stampsAdded,
    this.currentStamps,
    this.rewardUnlocked,
  });

  factory ScanResultModel.fromJson(Map<String, dynamic> json) =>
      _$ScanResultModelFromJson(json);

  Map<String, dynamic> toJson() => _$ScanResultModelToJson(this);
}
