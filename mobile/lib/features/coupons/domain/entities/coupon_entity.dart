import 'package:equatable/equatable.dart';

class CouponEntity extends Equatable {
  final int id;
  final String code;
  final String? name;
  final String? description;
  final String discountType;
  final String discountValue;
  final String? minPurchaseAmount;
  final int? maxUses;
  final int? currentUses;
  final String? startsAt;
  final String? expiresAt;
  final String? merchantName;
  final String? merchantSlug;
  final bool isClaimed;

  const CouponEntity({
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
    this.merchantName,
    this.merchantSlug,
    this.isClaimed = false,
  });

  @override
  List<Object?> get props => [
        id, code, name, description,
        discountType, discountValue, minPurchaseAmount,
        maxUses, currentUses, startsAt, expiresAt,
        merchantName, merchantSlug, isClaimed,
      ];
}
