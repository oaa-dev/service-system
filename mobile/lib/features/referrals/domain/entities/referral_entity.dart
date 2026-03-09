import 'package:equatable/equatable.dart';

class ReferralEntity extends Equatable {
  final int id;
  final String? referrerName;
  final String? refereeName;
  final String status;
  final String? merchantName;
  final String createdAt;

  const ReferralEntity({
    required this.id,
    this.referrerName,
    this.refereeName,
    required this.status,
    this.merchantName,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id, referrerName, refereeName,
        status, merchantName, createdAt,
      ];
}
