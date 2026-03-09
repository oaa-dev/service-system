// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'referral_reward_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReferralRewardModel _$ReferralRewardModelFromJson(Map<String, dynamic> json) =>
    ReferralRewardModel(
      id: (json['id'] as num).toInt(),
      type: json['type'] as String,
      value: json['value'] as String,
      status: json['status'] as String,
      expiresAt: json['expires_at'] as String?,
      createdAt: json['created_at'] as String,
      merchant: json['merchant'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ReferralRewardModelToJson(
  ReferralRewardModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'type': instance.type,
  'value': instance.value,
  'status': instance.status,
  'expires_at': instance.expiresAt,
  'created_at': instance.createdAt,
  'merchant': instance.merchant,
};
