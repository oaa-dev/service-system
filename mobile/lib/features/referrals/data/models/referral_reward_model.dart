import 'package:json_annotation/json_annotation.dart';

part 'referral_reward_model.g.dart';

@JsonSerializable()
class ReferralRewardModel {
  final int id;
  final String type;
  final String value;
  final String status;
  @JsonKey(name: 'expires_at')
  final String? expiresAt;
  @JsonKey(name: 'created_at')
  final String createdAt;
  final Map<String, dynamic>? merchant;

  const ReferralRewardModel({
    required this.id,
    required this.type,
    required this.value,
    required this.status,
    this.expiresAt,
    required this.createdAt,
    this.merchant,
  });

  factory ReferralRewardModel.fromJson(Map<String, dynamic> json) =>
      _$ReferralRewardModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReferralRewardModelToJson(this);

  String? get merchantName => merchant?['name'] as String?;
}
