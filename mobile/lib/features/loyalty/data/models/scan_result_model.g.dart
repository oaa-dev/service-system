// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scan_result_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ScanResultModel _$ScanResultModelFromJson(Map<String, dynamic> json) =>
    ScanResultModel(
      success: json['success'] as bool,
      message: json['message'] as String,
      stampsAdded: (json['stamps_added'] as num?)?.toInt(),
      currentStamps: (json['current_stamps'] as num?)?.toInt(),
      rewardUnlocked: json['reward_unlocked'] as String?,
    );

Map<String, dynamic> _$ScanResultModelToJson(ScanResultModel instance) =>
    <String, dynamic>{
      'success': instance.success,
      'message': instance.message,
      'stamps_added': instance.stampsAdded,
      'current_stamps': instance.currentStamps,
      'reward_unlocked': instance.rewardUnlocked,
    };
