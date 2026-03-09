// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'loyalty_reward_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LoyaltyRewardModel _$LoyaltyRewardModelFromJson(Map<String, dynamic> json) =>
    LoyaltyRewardModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      description: json['description'] as String?,
      type: json['type'] as String,
      value: json['value'] as String,
      status: json['status'] as String,
      expiresAt: json['expires_at'] as String?,
      merchant: json['merchant'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$LoyaltyRewardModelToJson(LoyaltyRewardModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'type': instance.type,
      'value': instance.value,
      'status': instance.status,
      'expires_at': instance.expiresAt,
      'merchant': instance.merchant,
    };
