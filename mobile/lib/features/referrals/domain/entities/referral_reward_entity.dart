import 'package:equatable/equatable.dart';

class ReferralRewardEntity extends Equatable {
  final int id;
  final String type;
  final String value;
  final String status;
  final String? merchantName;
  final String? expiresAt;
  final String createdAt;

  const ReferralRewardEntity({
    required this.id,
    required this.type,
    required this.value,
    required this.status,
    this.merchantName,
    this.expiresAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, type, value, status,
        merchantName, expiresAt, createdAt,
      ];
}
