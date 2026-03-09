import 'package:equatable/equatable.dart';

class LoyaltyStampEntity extends Equatable {
  final int id;
  final String source;
  final String earnedAt;
  final String? expiresAt;
  final bool isExpired;

  const LoyaltyStampEntity({
    required this.id,
    required this.source,
    required this.earnedAt,
    this.expiresAt,
    required this.isExpired,
  });

  @override
  List<Object?> get props => [id, source, earnedAt, expiresAt, isExpired];
}
