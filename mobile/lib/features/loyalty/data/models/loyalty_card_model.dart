import 'package:json_annotation/json_annotation.dart';

part 'loyalty_card_model.g.dart';

@JsonSerializable()
class LoyaltyCardModel {
  final int id;
  final Map<String, dynamic>? merchant;
  final Map<String, dynamic>? program;
  @JsonKey(name: 'current_stamps')
  final int currentStamps;
  @JsonKey(name: 'required_stamps')
  final int requiredStamps;
  @JsonKey(name: 'total_stamps_earned')
  final int totalStampsEarned;
  @JsonKey(name: 'total_rewards_earned')
  final int totalRewardsEarned;
  final String status;

  const LoyaltyCardModel({
    required this.id,
    this.merchant,
    this.program,
    required this.currentStamps,
    required this.requiredStamps,
    required this.totalStampsEarned,
    required this.totalRewardsEarned,
    required this.status,
  });

  factory LoyaltyCardModel.fromJson(Map<String, dynamic> json) =>
      _$LoyaltyCardModelFromJson(json);

  Map<String, dynamic> toJson() => _$LoyaltyCardModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;

  String? get merchantLogo {
    final logo = merchant?['logo'];
    if (logo is Map) return (logo['thumb'] ?? logo['url']) as String?;
    return null;
  }

  String get programName =>
      (program?['name'] as String?) ?? 'Loyalty Program';
}
