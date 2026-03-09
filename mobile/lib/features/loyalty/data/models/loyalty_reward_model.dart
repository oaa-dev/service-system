import 'package:json_annotation/json_annotation.dart';

part 'loyalty_reward_model.g.dart';

@JsonSerializable()
class LoyaltyRewardModel {
  final int id;
  final String name;
  final String? description;
  final String type;
  final String value;
  final String status;
  @JsonKey(name: 'expires_at')
  final String? expiresAt;
  final Map<String, dynamic>? merchant;

  const LoyaltyRewardModel({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.value,
    required this.status,
    this.expiresAt,
    this.merchant,
  });

  factory LoyaltyRewardModel.fromJson(Map<String, dynamic> json) =>
      _$LoyaltyRewardModelFromJson(json);

  Map<String, dynamic> toJson() => _$LoyaltyRewardModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;
}
