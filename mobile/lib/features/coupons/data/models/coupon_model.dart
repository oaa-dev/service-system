import 'package:json_annotation/json_annotation.dart';

part 'coupon_model.g.dart';

@JsonSerializable()
class CouponModel {
  final int id;
  final String code;
  final String? name;
  final String? description;
  @JsonKey(name: 'discount_type')
  final String discountType;
  @JsonKey(name: 'discount_value')
  final String discountValue;
  @JsonKey(name: 'min_purchase_amount')
  final String? minPurchaseAmount;
  @JsonKey(name: 'max_uses')
  final int? maxUses;
  @JsonKey(name: 'current_uses')
  final int? currentUses;
  @JsonKey(name: 'starts_at')
  final String? startsAt;
  @JsonKey(name: 'expires_at')
  final String? expiresAt;
  @JsonKey(name: 'is_claimed')
  final bool? isClaimed;
  final Map<String, dynamic>? merchant;

  const CouponModel({
    required this.id,
    required this.code,
    this.name,
    this.description,
    required this.discountType,
    required this.discountValue,
    this.minPurchaseAmount,
    this.maxUses,
    this.currentUses,
    this.startsAt,
    this.expiresAt,
    this.isClaimed,
    this.merchant,
  });

  factory CouponModel.fromJson(Map<String, dynamic> json) =>
      _$CouponModelFromJson(json);

  Map<String, dynamic> toJson() => _$CouponModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;

  String? get merchantSlug => merchant?['slug'] as String?;
}
