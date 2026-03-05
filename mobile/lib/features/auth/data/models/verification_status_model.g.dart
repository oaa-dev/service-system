// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'verification_status_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

VerificationStatusModel _$VerificationStatusModelFromJson(
  Map<String, dynamic> json,
) => VerificationStatusModel(
  isVerified: json['is_verified'] as bool,
  canResend: json['can_resend'] as bool,
  lockedUntil: json['locked_until'] as String?,
  expiresAt: json['expires_at'] as String?,
);

Map<String, dynamic> _$VerificationStatusModelToJson(
  VerificationStatusModel instance,
) => <String, dynamic>{
  'is_verified': instance.isVerified,
  'can_resend': instance.canResend,
  'locked_until': instance.lockedUntil,
  'expires_at': instance.expiresAt,
};
