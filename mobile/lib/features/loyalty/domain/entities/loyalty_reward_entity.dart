import 'package:equatable/equatable.dart';

class LoyaltyRewardEntity extends Equatable {
  final int id;
  final String name;
  final String? description;
  final String type;
  final String value;
  final String status;
  final String? expiresAt;
  final String? merchantName;

  const LoyaltyRewardEntity({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.value,
    required this.status,
    this.expiresAt,
    this.merchantName,
  });

  @override
  List<Object?> get props => [
        id, name, description, type, value,
        status, expiresAt, merchantName,
      ];
}
