import 'package:equatable/equatable.dart';

class ScanResultEntity extends Equatable {
  final bool success;
  final String message;
  final int? stampsAdded;
  final int? currentStamps;
  final String? rewardUnlocked;

  const ScanResultEntity({
    required this.success,
    required this.message,
    this.stampsAdded,
    this.currentStamps,
    this.rewardUnlocked,
  });

  @override
  List<Object?> get props => [
        success, message, stampsAdded,
        currentStamps, rewardUnlocked,
      ];
}
