// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'referral_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReferralModel _$ReferralModelFromJson(Map<String, dynamic> json) =>
    ReferralModel(
      id: (json['id'] as num).toInt(),
      status: json['status'] as String,
      createdAt: json['created_at'] as String,
      referrer: json['referrer'] as Map<String, dynamic>?,
      referee: json['referee'] as Map<String, dynamic>?,
      merchant: json['merchant'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ReferralModelToJson(ReferralModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'status': instance.status,
      'created_at': instance.createdAt,
      'referrer': instance.referrer,
      'referee': instance.referee,
      'merchant': instance.merchant,
    };
