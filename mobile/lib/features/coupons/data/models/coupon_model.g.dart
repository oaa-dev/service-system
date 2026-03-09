// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'coupon_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CouponModel _$CouponModelFromJson(Map<String, dynamic> json) => CouponModel(
  id: (json['id'] as num).toInt(),
  code: json['code'] as String,
  name: json['name'] as String?,
  description: json['description'] as String?,
  discountType: json['discount_type'] as String,
  discountValue: json['discount_value'] as String,
  minPurchaseAmount: json['min_purchase_amount'] as String?,
  maxUses: (json['max_uses'] as num?)?.toInt(),
  currentUses: (json['current_uses'] as num?)?.toInt(),
  startsAt: json['starts_at'] as String?,
  expiresAt: json['expires_at'] as String?,
  isClaimed: json['is_claimed'] as bool?,
  merchant: json['merchant'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$CouponModelToJson(CouponModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'name': instance.name,
      'description': instance.description,
      'discount_type': instance.discountType,
      'discount_value': instance.discountValue,
      'min_purchase_amount': instance.minPurchaseAmount,
      'max_uses': instance.maxUses,
      'current_uses': instance.currentUses,
      'starts_at': instance.startsAt,
      'expires_at': instance.expiresAt,
      'is_claimed': instance.isClaimed,
      'merchant': instance.merchant,
    };
