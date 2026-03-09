import 'package:equatable/equatable.dart';

class ReferralCodeEntity extends Equatable {
  final int id;
  final String code;
  final String? merchantName;
  final int? merchantId;
  final int usesCount;
  final String? expiresAt;
  final String createdAt;

  const ReferralCodeEntity({
    required this.id,
    required this.code,
    this.merchantName,
    this.merchantId,
    required this.usesCount,
    this.expiresAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, code, merchantName, merchantId,
        usesCount, expiresAt, createdAt,
      ];
}
