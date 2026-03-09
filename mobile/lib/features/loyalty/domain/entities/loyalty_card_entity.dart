import 'package:equatable/equatable.dart';

class LoyaltyCardEntity extends Equatable {
  final int id;
  final String? merchantName;
  final String? merchantLogo;
  final String programName;
  final int currentStamps;
  final int requiredStamps;
  final int totalStampsEarned;
  final int totalRewardsEarned;
  final String status;

  const LoyaltyCardEntity({
    required this.id,
    this.merchantName,
    this.merchantLogo,
    required this.programName,
    required this.currentStamps,
    required this.requiredStamps,
    required this.totalStampsEarned,
    required this.totalRewardsEarned,
    required this.status,
  });

  @override
  List<Object?> get props => [
        id, merchantName, merchantLogo, programName,
        currentStamps, requiredStamps, totalStampsEarned,
        totalRewardsEarned, status,
      ];
}
