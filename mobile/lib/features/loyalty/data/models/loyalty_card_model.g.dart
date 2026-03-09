// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'loyalty_card_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LoyaltyCardModel _$LoyaltyCardModelFromJson(Map<String, dynamic> json) =>
    LoyaltyCardModel(
      id: (json['id'] as num).toInt(),
      merchant: json['merchant'] as Map<String, dynamic>?,
      program: json['program'] as Map<String, dynamic>?,
      currentStamps: (json['current_stamps'] as num).toInt(),
      requiredStamps: (json['required_stamps'] as num).toInt(),
      totalStampsEarned: (json['total_stamps_earned'] as num).toInt(),
      totalRewardsEarned: (json['total_rewards_earned'] as num).toInt(),
      status: json['status'] as String,
    );

Map<String, dynamic> _$LoyaltyCardModelToJson(LoyaltyCardModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'merchant': instance.merchant,
      'program': instance.program,
      'current_stamps': instance.currentStamps,
      'required_stamps': instance.requiredStamps,
      'total_stamps_earned': instance.totalStampsEarned,
      'total_rewards_earned': instance.totalRewardsEarned,
      'status': instance.status,
    };
