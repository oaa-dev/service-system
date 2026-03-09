// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'referral_code_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReferralCodeModel _$ReferralCodeModelFromJson(Map<String, dynamic> json) =>
    ReferralCodeModel(
      id: (json['id'] as num).toInt(),
      code: json['code'] as String,
      usesCount: (json['uses_count'] as num?)?.toInt(),
      expiresAt: json['expires_at'] as String?,
      createdAt: json['created_at'] as String,
      merchant: json['merchant'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ReferralCodeModelToJson(ReferralCodeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'uses_count': instance.usesCount,
      'expires_at': instance.expiresAt,
      'created_at': instance.createdAt,
      'merchant': instance.merchant,
    };
